import type { Role } from '../types/user';

/** Where each role lands after logging in. */
export const homePathFor = (role: Role): string =>
  role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
