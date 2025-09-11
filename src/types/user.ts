export interface User {
  id: string;
  googleid: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'customer';

export interface UserRoleUpdate {
  role: UserRole;
}

export interface UserUpdate {
  name: string;
  email: string;
}

export interface UserStats {
  total_users: number;
  admin_users: number;
  customer_users: number;
  recent_users: number;
}
