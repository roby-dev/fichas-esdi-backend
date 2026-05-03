import { SetMetadata } from '@nestjs/common';

export const ALLOW_MUST_CHANGE_PASSWORD = 'allow_must_change_password';

/**
 * Decorates a route or controller so that MustChangePasswordGuard allows it
 * even when req.user.mustChangePassword === true.
 *
 * Use on any endpoint that a forced-change user must be able to reach:
 *   - PATCH /auth/change-password  (the flow itself)
 *   - POST  /auth/logout           (user must always be able to log out)
 *   - GET   /auth/me               (client needs user shell to render the UI)
 *   - POST  /auth/login            (public — no req.user, guard short-circuits anyway)
 *   - POST  /auth/refresh          (public — no req.user, guard short-circuits anyway)
 */
export const AllowWhenMustChangePassword = () =>
  SetMetadata(ALLOW_MUST_CHANGE_PASSWORD, true);
