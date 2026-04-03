import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairTypeMaterial } from '../../core/models/repair-type-material.model';
import { RepairTypeRelationApiService } from '../../core/services/repair-type-relation-api.service';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class RepairTypeRelationRepository {
  constructor(private apiService: RepairTypeRelationApiService) {}

  // Materials
  getMaterials(repairTypeId: string): Observable<RepairTypeMaterial[]> {
    return this.apiService.getMaterials(repairTypeId, this.getStoredStoreId());
  }

  addMaterial(materialRelation: RepairTypeMaterial): Observable<RepairTypeMaterial> {

    const createMaterialRelation = {
      repair_type_id: materialRelation.repairTypeId,
      material_id: materialRelation.materialId,
      quantity: materialRelation.quantity,
      unit_cost_override: materialRelation.unitCost,
      is_optional: materialRelation.isOptional,
      sort_order: materialRelation.sortOrder,
      store_id: this.getStoredStoreId(),
      created_by: this.getStoredUserId()
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
      updated_by: this.getStoredUserId()
    }

    return this.apiService.updateMaterial(materialRelation.repairTypeId, materialRelation.materialId, materialRelation.storeId, updateMaterialRelation);
  }

  removeMaterial(materialRelation: RepairTypeMaterial): Observable<void> {
    const deleteMaterialRelation = {
      repair_type_id: materialRelation.repairTypeId,
      material_id: materialRelation.materialId,
      store_id: this.getStoredStoreId()    }

    return this.apiService.removeMaterial(materialRelation.repairTypeId, deleteMaterialRelation);
  }

  private getStoredStoreId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).store?.id || '';
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }
}
