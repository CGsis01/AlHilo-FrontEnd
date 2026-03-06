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
  createdAt: Date;
  updatedAt: Date;
}
