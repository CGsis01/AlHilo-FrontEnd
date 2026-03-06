export enum UserRoleCode {
  ADMIN = 'Administrator',
  SEAMSTRESS = 'Seamstress',
  RECEPTIONIST = 'Receptionist'
}

export interface UserRole {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  token: AuthToken;
}
