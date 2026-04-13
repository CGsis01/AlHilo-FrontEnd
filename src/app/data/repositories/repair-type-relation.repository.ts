import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairTypeMaterial } from '../../core/models/repair-type-material.model';
import { RepairTypeRelationApiService } from '../../core/services/repair-type-relation-api.service';
import { getStoredUserId, getStoredStoreId } from '../../shared/utils/userLocalData.utils';

@Injectable({
  providedIn: 'root'
})

export class RepairTypeRelationRepository {
  constructor(private apiService: RepairTypeRelationApiService) {}

  // Materials
  getMaterials(repairTypeId: string): Observable<RepairTypeMaterial[]> {
    return this.apiService.getMaterials(repairTypeId, getStoredStoreId());
  }

  addMaterial(materialRelation: RepairTypeMaterial): Observable<RepairTypeMaterial> {
    const createMaterialRelation = {
      repair_type_id: materialRelation.repairTypeId,
      material_id: materialRelation.materialId,
      quantity: materialRelation.quantity,
      unit_cost_override: materialRelation.unitCost,
      is_optional: materialRelation.isOptional,
      sort_order: materialRelation.sortOrder,
      store_id: getStoredStoreId(),
      created_by: getStoredUserId()
    }

    return this.apiService.addMaterial(materialRelation.repairTypeId, createMaterialRelation);
  }

  updateMaterial(materialRelation: RepairTypeMaterial): Observable<RepairTypeMaterial> {
    const updateMaterialRelation = {
      quantity: materialRelation.quantity,
      unit_cost_override: materialRelation.unitCost,
      is_optional: materialRelation.isOptional,
      sort_order: materialRelation.sortOrder,
      store_id: materialRelation.storeId,
      updated_by: getStoredUserId()
    }

    return this.apiService.updateMaterial(materialRelation.repairTypeId, materialRelation.materialId, materialRelation.storeId, updateMaterialRelation);
  }

  removeMaterial(materialRelation: RepairTypeMaterial): Observable<void> {
    const deleteMaterialRelation = {
      repair_type_id: materialRelation.repairTypeId,
      material_id: materialRelation.materialId,
      store_id: getStoredStoreId()    }

    return this.apiService.removeMaterial(materialRelation.repairTypeId, deleteMaterialRelation);
  }
}
