export type Role = 'CANDIDATE' | 'ADMIN';

export interface User {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string | null;
  role: Role;
  createdAt: string;
}
