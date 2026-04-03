import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { RepairType } from '../models/repair-type.model';
import { PaginatedResponse } from '../interfaces/api-response.interface';

export interface CreateRepairTypeRequest {
  name: string;
  code: string;
  estimated_price: number;
  estimated_time: number;
  is_active?: boolean;
}

export interface UpdateRepairTypeRequest {
  name?: string;
  code?: string;
  estimated_price?: number;
  estimated_time?: number;
  is_active?: boolean;
}

export interface ActivateRepairTypeRequest {
  id: string;
  updated_by: string;
}

export interface DeactivateRepairTypeRequest {
  id: string;
  updated_by: string;
}

export interface RepairTypeFilters {
  is_active?: boolean;
  search?: string;
  min_price?: number;
  max_price?: number;
  store_id?: string;
}

@Injectable({
  providedIn: 'root'
})

export class RepairTypeApiService {
  private readonly endpoint = '/repair-types';

  constructor(private apiService: ApiService) {}

  getAll(filters?: RepairTypeFilters): Observable<RepairType[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<RepairType[]>(this.endpoint, params)
    .pipe(map(response => response.map(rt => this.mapRepairType(rt))));
  }

  getByStore(storeId: string): Observable<RepairType[]> {
    return this.getAll({ store_id: storeId });
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: RepairTypeFilters): Observable<PaginatedResponse<RepairType>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.min_price !== undefined) params = params.set('min_price', filters.min_price.toString());
      if (filters.max_price !== undefined) params = params.set('max_price', filters.max_price.toString());
    }

    return this.apiService.get<PaginatedResponse<RepairType>>(this.endpoint, params);
  }

  getById(id: string): Observable<RepairType> {
    return this.apiService.get<RepairType>(`${this.endpoint}/${id}`);
  }

  create(repairTypeData: CreateRepairTypeRequest): Observable<RepairType> {
    return this.apiService.post<RepairType>(this.endpoint, repairTypeData)
    .pipe(map(response => this.mapRepairType(response)));
  }

  update(id: string, repairTypeData: UpdateRepairTypeRequest): Observable<RepairType> {
    return this.apiService.put<RepairType>(`${this.endpoint}/${id}`, repairTypeData)
    .pipe(map(response => this.mapRepairType(response)));
  }

  patch(id: string, repairTypeData: Partial<UpdateRepairTypeRequest>): Observable<RepairType> {
    return this.apiService.patch<RepairType>(`${this.endpoint}/${id}`, repairTypeData)
    .pipe(map(response => this.mapRepairType(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  activate(repair_type_data: ActivateRepairTypeRequest): Observable<boolean> {
    return this.apiService.put<boolean>(`${this.endpoint}/activate`, repair_type_data)
    .pipe(map(() => true));
  }

  deactivate(repair_type_data: DeactivateRepairTypeRequest): Observable<boolean> {
    return this.apiService.put<boolean>(`${this.endpoint}/deactivate`, repair_type_data)
    .pipe(map(() => true));
  }

  private mapRepairType(repairType: any): RepairType {
    return {
      id: repairType.id,
      name: repairType.name,
      code: repairType.code,
      estimatedPrice: repairType.estimated_price,
      estimatedTime: repairType.estimated_time,
      commissionPercentage: repairType.commission_percentage,
      repairComplexity: {
        id: repairType.repair_complexity.id,
        name: repairType.repair_complexity.name,
        code: repairType.repair_complexity.code,
        laborMultiplier: repairType.repair_complexity.labor_multiplier,
        timeMultiplier: repairType.repair_complexity.time_multiplier,
        storeId: repairType.repair_complexity.store_id,
        isActive: repairType.repair_complexity.is_active,
        createdAt: repairType.repair_complexity.created_at,
        updatedAt: repairType.repair_complexity.updated_at
      },
      store: {
        id: repairType.store.id,
        name: repairType.store.name,
        isActive: repairType.store.is_active,
        createdAt: repairType.store.created_at,
        updatedAt: repairType.store.updated_at
      },
      isActive: repairType.is_active,
      createdAt: repairType.created_at};
  }
}
