import { Repair } from './repair.model';
import { Garment } from './garment.model';
import { RepairType } from './repair-type.model';
import { RepairStatus } from './repair-status.model';
import { User } from './user.model';

export interface RepairItem {
  id?: string;
  repairId?: string;
  repair?: Repair;
  garment: Garment;
  repairTypes: RepairType[];
  description: string;
  estimatedPrice: number;
  finalPrice?: number;
  repairStatus?: RepairStatus;
  assignedTo?: User;
  assignedToId?: string;
  attendedById?: string;
  attendedBy?: User;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

