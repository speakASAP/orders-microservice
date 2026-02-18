/**
 * Roles decorator - required roles for endpoint (OR logic by default).
 * Use with JwtRolesGuard. Roles from auth-microservice: global:superadmin, internal:service:admin, etc.
 */

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, { roles });
export const Public = () => SetMetadata('public', true);
export const PUBLIC_KEY = 'public';
