/**
 * Orders Auth Roles Guard
 * Validates human Bearer tokens through auth-microservice and enforces Auth-owned roles.
 * Use @Roles('global:superadmin', 'internal:orders-microservice:admin') and @Public() for health.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
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
  };
};

@Injectable()
export class JwtRolesGuard implements CanActivate {
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
    const requiredRoles = rolesMetadata?.roles?.length ? rolesMetadata.roles : this.getDefaultRoles();

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
      || (r === 'authenticated:user' && !isInternalService)
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
      'payments-microservice': {
        token: this.resolveEnvToken('PAYMENTS_INTERNAL_SERVICE_TOKEN', 'PAYMENTS_ORDERS_SERVICE_TOKEN'),
        role: 'internal:payments-microservice:service',
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

  private getDefaultRoles(): string[] {
    const name = process.env.SERVICE_NAME || 'orders-microservice';
    return [`global:superadmin`, `internal:${name}:admin`];
  }
}
