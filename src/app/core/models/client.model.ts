import { Store } from "./store.model";

export interface Client {
  id: string;
  fullName: string;
  address: string;
  personalPhone: string;
  contactPhone: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  birthDate?: Date;
  store?: Store
  createdAt: Date;
  updatedAt: Date;
}
