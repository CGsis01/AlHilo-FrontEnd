import { RepairComplexity } from "./repair-complexity.model";
import { Store } from "./store.model";

export interface RepairType {
  id: string;
  name: string;
  code: string;
  estimatedPrice: number;
  estimatedTime: number; // in hours
  commissionPercentage: number;
  repairComplexity: RepairComplexity;
  store: Store;
  isActive: boolean;
  createdAt: string;
}
