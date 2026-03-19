export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  rfc?: string;
  url?: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
