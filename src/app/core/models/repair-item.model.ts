import { Garment } from './garment.model';
import { RepairType } from './repair-type.model';

export interface RepairItem {
  id?: string;
  repairId?: string;
  garment: Garment;
  repairType: RepairType;
  description: string;
  estimatedPrice: number;
  finalPrice?: number;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

