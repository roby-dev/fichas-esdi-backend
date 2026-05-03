/** Emitted when an authenticated user changes their own password (self-service flow). */
export const PASSWORD_CHANGED = 'PASSWORD_CHANGED';

/** Emitted when an admin resets a target user's password and forces a change on next login. */
export const PASSWORD_RESET_BY_ADMIN = 'PASSWORD_RESET_BY_ADMIN';

/** Emitted when a user with mustChangePassword=true completes the forced-change flow. */
export const PASSWORD_FORCED_CHANGE = 'PASSWORD_FORCED_CHANGE';
