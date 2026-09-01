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

    // LEGACY STATIC-CREDENTIAL PATH — do not add entries.
    //
    // This path takes the caller's identity from the x-service-name header and only
    // string-compares the token. That is safe ONLY while every entry holds a
    // credential unique to one caller: any value appearing under two names lets its
    // holder pick which of those names it authenticates as.
    //
    // aukro, bazos, heureka, marketing, payments and warehouse used to live here and
    // all six held the SAME string (sha256 a2880693), so one holder could
    // authenticate as any of the six. They are now on per-pair RS256 principals
    // verified through /auth/validate (line 71's Bearer path) and have been removed.
    //
    // flipflop-service, allegro-service, invoices-microservice and cliplot were all
    // removed on 2026-09-01, each verified on Bearer from its deployed pod before its
    // entry was deleted. Only catalog-microservice remains.
    //
    // catalog is NOT a like-for-like migration and is deliberately left here: its value
    // (sha256 5f420714) is a single shared password held by EIGHT services, because
    // catalog's own inbound guard mints internal:catalog-microservice:admin + catalog:write
    // from an unauthenticated x-service-name header. Retiring it means separating that one
    // secret into per-caller credentials across eight repos -- a separate workstream, not a
    // step in this one. Do not swap this value alone: seven inbound lanes to catalog read
    // the same Vault property and would break together.
    //
    // Delete this method once catalog is migrated; new callers must use Bearer.
    const configuredServices: Record<string, { token?: string; role: string }> = {
      'catalog-microservice': {
        token: this.resolveEnvToken('CATALOG_INTERNAL_SERVICE_TOKEN'),
        role: 'internal:catalog-microservice:service',
      },
    };

    const service = configuredServices[serviceName];
    if (!service?.token || !this.safeEqual(providedToken, service.token)) {
      return null;
    }

    // Defence in depth: refuse a credential configured for more than one caller.
    // Without this, re-introducing a shared value silently restores the ability to
    // choose an identity via the header. Deny rather than pick — an ambiguous
    // credential must never authenticate.
    const namesSharingToken = Object.entries(configuredServices)
      .filter(([, candidate]) => candidate.token && this.safeEqual(providedToken, candidate.token))
      .map(([name]) => name);
    if (namesSharingToken.length > 1) {
      // Caller names only — no part of the presented value is logged. Wording avoids
      // the terms scripts/verify-sensitive-logging.js bans from log arguments.
      this.logger.error(
        `Ambiguous internal service identity: the presented value is configured for `
          + `multiple callers (${namesSharingToken.join(', ')}), so the x-service-name `
          + `header (claimed: ${serviceName}) cannot select between them. Request denied. `
          + 'Give each caller its own per-pair RS256 principal.',
      );
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
