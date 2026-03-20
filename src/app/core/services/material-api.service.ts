import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Material } from '../models/material.model';
import { PaginatedResponse } from '../interfaces/api-response.interface';

export interface CreateMaterialRequest {
  name: string;
  unit: string;
  unit_cost: number;
  store_id: string;
  created_by: string;
}

export interface UpdateMaterialRequest {
  name?: string;
  unit?: string;
  unit_cost?: number;
  store_id?: string;
  updated_by: string;
}

export interface ActivateMaterialRequest {
  id: string;
  updated_by: string;
}

export interface DeactivateMaterialRequest {
  id: string;
  updated_by: string;
}

export interface MaterialFilters {
  is_active?: boolean;
  search?: string;
  store_id?: string;
}

@Injectable({
  providedIn: 'root'
})

export class MaterialApiService {
  private readonly endpoint = '/materials';

  constructor(private apiService: ApiService) {}

  getAll(filters?: MaterialFilters): Observable<Material[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<Material[]>(this.endpoint, params)
    .pipe(map(response => response.map(m => this.mapMaterial(m))));
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: MaterialFilters): Observable<PaginatedResponse<Material>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<PaginatedResponse<Material>>(this.endpoint, params);
  }

  getById(id: string): Observable<Material> {
    return this.apiService.get<Material>(`${this.endpoint}/${id}`)
    .pipe(map(response => this.mapMaterial(response)));
  }

  create(materialData: CreateMaterialRequest): Observable<Material> {
    return this.apiService.post<Material>(this.endpoint, materialData)
    .pipe(map(response => this.mapMaterial(response)));
  }

  update(id: string, materialData: UpdateMaterialRequest): Observable<Material> {
    return this.apiService.put<Material>(`${this.endpoint}/${id}`, materialData)
    .pipe(map(response => this.mapMaterial(response)));
  }

  patch(id: string, materialData: Partial<UpdateMaterialRequest>): Observable<Material> {
    return this.apiService.patch<Material>(`${this.endpoint}/${id}`, materialData)
    .pipe(map(response => this.mapMaterial(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  activate(material_data: ActivateMaterialRequest): Observable<boolean> {
    return this.apiService.put<Material>(`${this.endpoint}/activate`, material_data)
    .pipe(map(() => true));
  }

  deactivate(material_data: DeactivateMaterialRequest): Observable<boolean> {
    return this.apiService.put<Material>(`${this.endpoint}/deactivate`, material_data)
    .pipe(map(() => true));
  }

  getActiveMaterials(storeId?: string): Observable<Material[]> {
    const filters: MaterialFilters = { is_active: true };
    if (storeId) {
      filters.store_id = storeId;
    }
    return this.getAll(filters);
  }

  getByStore(storeId: string): Observable<Material[]> {
    return this.getAll({ store_id: storeId });
  }

  private mapMaterial(material: any): Material {
      return {
        id: material.id,
        name: material.name,
        unit: material.unit,
        unitCost: material.unit_cost,
        storeId: material.store_id,
        isActive: material.is_active,
        createdAt: material.created_at,
        updatedAt: material.updated_at};
    }
}
