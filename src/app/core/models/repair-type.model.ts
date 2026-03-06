export interface RepairType {
  id: string;
  name: string;
  code: string;
  estimatedPrice: number;
  estimatedTime: number; // in hours
  commissionPercentage: number;
  isActive: boolean;
  createdAt: string;
}
