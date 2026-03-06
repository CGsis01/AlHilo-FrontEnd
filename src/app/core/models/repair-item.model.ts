import { RepairType } from './repair-type.model';

export interface RepairItem {
  id?: string;
  repairId?: string;
  garmentType: string;
  repairType: RepairType;
  description: string;
  estimatedPrice: number;
  finalPrice?: number;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

