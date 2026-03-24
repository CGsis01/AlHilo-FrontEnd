export interface GarmentRepairType {
  repairTypeId: string;
  repairTypeName: string;
  repairTypeCode: string;
  isDefault: boolean;
  estimatedPriceOverride?: number;
  estimatedTimeOverride?: number;
  sortOrder?: number;
  isActive: boolean;
}

export interface Garment {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
  storeId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  repairTypes: GarmentRepairType[];
}
