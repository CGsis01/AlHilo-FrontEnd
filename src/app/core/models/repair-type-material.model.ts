export interface RepairTypeMaterial {
  repairTypeId: string;
  materialId: string;
  materialName: string;
  materialUnit: string;
  quantity: number;
  unitCost: number;
  isOptional: boolean;
  sortOrder: number;
  storeId: string;
  isActive: boolean;
  createdAt: Date;
}
