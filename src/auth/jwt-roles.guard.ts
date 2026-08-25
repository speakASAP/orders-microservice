/**
 * Orders Auth Roles Guard
 * Validates human Bearer tokens through auth-microservice and enforces Auth-owned roles.
 * Use @Roles('global:superadmin', 'internal:orders-microservice:admin') and @Public() for health.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { ROLES_KEY, PUBLIC_KEY } from './roles.decorator';

type AuthValidateResponse = {
  valid?: boolean;
  user?: {
    id?: string;
    sub?: string;
    email?: string;
    roles?: string[];
    source?: unknown;
    perApplicationPreferences?: unknown;
  };
};

@Injectable()
export class JwtRolesGuard implements CanActivate {
  private readonly logger = new Logger(JwtRolesGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const rolesMetadata = this.reflector.getAllAndOverride<{ roles: string[] }>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Deny by default. An undecorated route previously inherited
    // [global:superadmin, internal:orders-microservice:admin], silently granting
    // the service's broadest role set to any route someone forgot to decorate.
    if (!rolesMetadata?.roles?.length) {
      const handler = context.getHandler()?.name ?? 'unknown';
      const controller = context.getClass()?.name ?? 'unknown';
      this.logger.error(
        `Route ${controller}.${handler} has no @Roles decorator; denying request.`,
      );
      throw new ForbiddenException('Route is missing an authorization policy');
    }

    const requiredRoles = rolesMetadata.roles;

    const request = context.switchToHttp().getRequest<Request>();
    const internalUser = this.resolveInternalServiceActor(request);
    const authHeader = request.headers.authorization;

    if (!internalUser && (!authHeader || !authHeader.startsWith('Bearer '))) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const user = internalUser || await this.validateTokenWithAuth(authHeader!.slice(7));
    const isInternalService = Boolean(internalUser);
    const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];

    const hasRole = requiredRoles.some((r) => userRoles.includes(r)
      || r === 'authenticated'
      || (r === 'authenticated:user' && this.canUseGenericAuthenticatedUserRole(user, isInternalService))
      || (r === 'authenticated:service' && isInternalService));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    (request as Request & { user: unknown }).user = {
      sub: user.sub || user.id,
      email: user.email,
      roles: userRoles,
    };
    return true;
  }

  private canUseGenericAuthenticatedUserRole(
    user: NonNullable<AuthValidateResponse['user']>,
    isInternalService: boolean,
  ): boolean {
    return !isInternalService && !this.isMarathonOnlyImportedUser(user);
  }

  private isMarathonOnlyImportedUser(user: NonNullable<AuthValidateResponse['user']>): boolean {
    const roles = Array.isArray(user.roles) ? user.roles.filter((role) => typeof role === 'string') : [];
    const hasMarathonMarker = roles.some((role) => this.isMarathonScopedRole(role))
      || this.containsMarathonMarker(user.source)
      || this.containsMarathonMarker(user.perApplicationPreferences);
    if (!hasMarathonMarker) {
      return false;
    }

    const hasNonMarathonAccess = roles.some((role) => this.isNonMarathonAccessRole(role))
      || this.containsNonMarathonPreferenceMarker(user.perApplicationPreferences);
    return !hasNonMarathonAccess;
  }

  private isMarathonScopedRole(role: string): boolean {
    const normalized = role.trim().toLowerCase();
    return normalized === 'marathon'
      || normalized === 'app:marathon:user'
      || normalized.startsWith('app:marathon:')
      || normalized.startsWith('internal:marathon:')
      || normalized.includes(':marathon:');
  }

  private isNonMarathonAccessRole(role: string): boolean {
    const normalized = role.trim().toLowerCase();
    if (!normalized || normalized === 'authenticated' || normalized === 'authenticated:user') {
      return false;
    }
    return !this.isMarathonScopedRole(normalized);
  }

  private containsMarathonMarker(value: unknown, depth = 0): boolean {
    if (value == null || depth > 4) {
      return false;
    }
    if (typeof value === 'string') {
      return value.toLowerCase().includes('marathon');
    }
    if (Array.isArray(value)) {
      return value.some((entry) => this.containsMarathonMarker(entry, depth + 1));
    }
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).some(([key, entry]) => (
        key.toLowerCase().includes('marathon') || this.containsMarathonMarker(entry, depth + 1)
      ));
    }
    return false;
  }

  private containsNonMarathonPreferenceMarker(value: unknown, depth = 0): boolean {
    if (value == null || depth > 4) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.some((entry) => this.containsNonMarathonPreferenceMarker(entry, depth + 1));
    }
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).some(([key, entry]) => {
        const normalizedKey = key.toLowerCase();
        if (normalizedKey.includes('marathon')) {
          return false;
        }
        if (this.isApplicationPreferenceKey(normalizedKey) && this.hasPreferenceValue(entry)) {
          return true;
        }
        return this.containsNonMarathonPreferenceMarker(entry, depth + 1);
      });
    }
    return false;
  }

  private isApplicationPreferenceKey(key: string): boolean {
    return key.startsWith('app:')
      || key.includes('microservice')
      || key.endsWith('-service')
      || key.endsWith('_service');
  }

  private hasPreferenceValue(value: unknown): boolean {
    if (value == null || value === false) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.some((entry) => this.hasPreferenceValue(entry));
    }
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((entry) => this.hasPreferenceValue(entry));
    }
    return true;
  }

  private resolveInternalServiceActor(request: Request): NonNullable<AuthValidateResponse['user']> | null {
    const providedToken = request.header('x-internal-service-token')?.trim();
    const serviceName = request.header('x-service-name')?.trim();
    if (!providedToken || !serviceName) {
      return null;
    }

    const configuredServices: Record<string, { token?: string; role: string }> = {
      'catalog-microservice': {
        token: this.resolveEnvToken('CATALOG_INTERNAL_SERVICE_TOKEN'),
        role: 'internal:catalog-microservice:service',
      },
      'flipflop-service': {
        token: this.resolveEnvToken('FLIPFLOP_INTERNAL_SERVICE_TOKEN'),
        role: 'internal:flipflop-service:service',
      },
      'allegro-service': {
        token: this.resolveEnvToken('ALLEGRO_INTERNAL_SERVICE_TOKEN'),
        role: 'internal:allegro-service:service',
      },
      'aukro-service': {
        token: this.resolveEnvToken('AUKRO_INTERNAL_SERVICE_TOKEN'),
        role: 'internal:aukro-service:service',
      },
      'bazos-service': {
        token: this.resolveEnvToken('BAZOS_INTERNAL_SERVICE_TOKEN'),
        role: 'internal:bazos-service:service',
      },
      'heureka-service': {
        token: this.resolveEnvToken('HEUREKA_INTERNAL_SERVICE_TOKEN'),
        role: 'internal:heureka-service:service',
      },
      'warehouse-microservice': {
        token: this.resolveEnvToken('WAREHOUSE_INTERNAL_SERVICE_TOKEN', 'WAREHOUSE_ORDERS_SERVICE_TOKEN'),
        role: 'internal:warehouse-microservice:service',
      },
      'payments-microservice': {
        token: this.resolveEnvToken('PAYMENTS_INTERNAL_SERVICE_TOKEN', 'PAYMENTS_ORDERS_SERVICE_TOKEN'),
        role: 'internal:payments-microservice:service',
      },
      'marketing-microservice': {
        token: this.resolveEnvToken('MARKETING_INTERNAL_SERVICE_TOKEN', 'MARKETING_ORDERS_SERVICE_TOKEN'),
        role: 'internal:marketing-microservice:service',
      },
      'invoices-microservice': {
        token: this.resolveEnvToken('INVOICES_INTERNAL_SERVICE_TOKEN', 'INVOICES_ORDERS_SERVICE_TOKEN'),
        role: 'internal:invoices-microservice:service',
      },
      'cliplot': {
        token: this.resolveEnvToken('CLIPLOT_ORDERS_SERVICE_TOKEN', 'CLIPLOT_SERVICE_TOKEN'),
        role: 'internal:cliplot:service',
      },
      'cliplot-service': {
        token: this.resolveEnvToken('CLIPLOT_ORDERS_SERVICE_TOKEN', 'CLIPLOT_SERVICE_TOKEN'),
        role: 'internal:cliplot-service:service',
      },
    };
    const service = configuredServices[serviceName];
    if (!service?.token || !this.safeEqual(providedToken, service.token)) {
      return null;
    }

    return {
      sub: `service:${serviceName}`,
      email: `${serviceName}@internal.invalid`,
      roles: [service.role],
    };
  }

  private resolveEnvToken(...names: string[]): string | undefined {
    for (const name of names) {
      const token = process.env[name]?.trim();
      if (token) return token;
    }
    return undefined;
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private async validateTokenWithAuth(token: string): Promise<NonNullable<AuthValidateResponse['user']>> {
    const authBaseUrl = (process.env.AUTH_SERVICE_URL || 'http://auth-microservice:3370').replace(/\/+$/, '');
    let response: Response;
    try {
      response = await fetch(`${authBaseUrl}/auth/validate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch {
      throw new UnauthorizedException('Auth token validation failed');
    }

    if (!response.ok) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = (await response.json().catch(() => null)) as AuthValidateResponse | null;
    if (!payload?.valid || !payload.user) {
      throw new UnauthorizedException('Invalid token');
    }

    return payload.user;
  }

}
