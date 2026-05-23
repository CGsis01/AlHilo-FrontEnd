import { RepairStatus } from "./repair-status.model";
import { RepairItem } from "./repair-item.model";
import { User } from "./user.model";

export enum RepairStatusEnum {
  PENDING = "Pendiente",
  IN_PROGRESS = "En progreso",
  IN_VALIDATION = "Por Validar",
  VALIDATED = "Validada",
  DELIVERED = "Entregada",
}

export interface Repair {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerId?: string;
  items?: RepairItem[];
  repairStatus: RepairStatus;
  estimatedPrice: number;
  finalPrice?: number;
  advancePayment?: number;
  isExpress?: boolean;
  createdBy: User;
  receivedDate: Date;
  estimatedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
