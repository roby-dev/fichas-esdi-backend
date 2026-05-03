import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'is_public';

/**
 * Marks a route or controller as public — AuthGuard skips JWT validation.
 * Use ONLY on endpoints that must be reachable without authentication
 * (e.g. POST /auth/login, POST /auth/refresh, health checks).
 *
 * AuthGuard is registered as APP_GUARD: every endpoint requires auth by default.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
