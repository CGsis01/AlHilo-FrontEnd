import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { RepairTypeMaterial } from '../models/repair-type-material.model';

export interface CreateRepairTypeMaterialRequest {
  repair_type_id: string;
  material_id: string;
  quantity: number;
  unit_cost_override: number;
  is_optional: boolean;
  sort_order: number;
  store_id: string;
  created_by: string;
}

export interface UpdateRepairTypeMaterialRequest {
  quantity?: number;
  unit_cost_override?: number;
  is_optional: boolean;
  sort_order: number;
  store_id: string;
  updated_by: string;
}

export interface DeleteRepairTypeMaterialRequest {
  repair_type_id: string;
  material_id: string;
  store_id: string;
}

@Injectable({
  providedIn: 'root'
})

export class RepairTypeRelationApiService {
  private readonly endpoint = '/repair-types';

  constructor(private apiService: ApiService) {}

  // Materials
  getMaterials(repairTypeId: string, store_id?: string): Observable<RepairTypeMaterial[]> {
    let params = new HttpParams();
        
    if (store_id) {
      params = params.set('store_id', store_id);
    }

    return this.apiService.get<RepairTypeMaterial[]>(`${this.endpoint}/${repairTypeId}/materials`, params)
      .pipe(map(res => res.map(r => this.mapMaterial(r))));
  }

  addMaterial(repairTypeId: string, data: CreateRepairTypeMaterialRequest): Observable<RepairTypeMaterial> {
    return this.apiService.post<RepairTypeMaterial>(`${this.endpoint}/${repairTypeId}/materials`, data)
      .pipe(map(r => this.mapMaterial(r)));
  }

  updateMaterial(repairTypeId: string, materialId: string, storeId: string, data: UpdateRepairTypeMaterialRequest): Observable<RepairTypeMaterial> {
    return this.apiService.put<RepairTypeMaterial>(`${this.endpoint}/${repairTypeId}/materials`, data)
      .pipe(map(r => this.mapMaterial(r)));
  }

  removeMaterial(repairTypeId: string, data: DeleteRepairTypeMaterialRequest): Observable<void> {
    let params = new HttpParams()
      .set('material_id', data.material_id)
      .set('store_id', data.store_id);

    return this.apiService.delete<void>(`${this.endpoint}/${repairTypeId}/materials?${params}`);
  }

  private mapMaterial(r: any): RepairTypeMaterial {
    return {
      repairTypeId: r.repair_type.id,
      materialId: r.material.id,
      materialName: r.material.name,
      materialUnit: r.material.unit,
      quantity: r.quantity,
      unitCost: r.unit_cost_override,
      isOptional: r.is_optional,
      sortOrder: r.sort_order,
      storeId: r.store.id,
      isActive: r.is_active,
      createdAt: r.created_at
    };
  }
}
