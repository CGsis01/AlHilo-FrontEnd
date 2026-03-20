import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { RepairComplexity } from '../models/repair-complexity.model';
import { PaginatedResponse } from '../interfaces/api-response.interface';

export interface CreateRepairComplexityRequest {
  name: string;
  code: string;
  labor_multiplier: number;
  time_multiplier: number;
  store_id: string;
  created_by: string;
}

export interface UpdateRepairComplexityRequest {
  name?: string;
  code?: string;
  labor_multiplier?: number;
  time_multiplier?: number;
  store_id?: string;
  updated_by: string;
}

export interface ActivateRepairComplexityRequest {
  id: string;
  updated_by: string;
}

export interface DeactivateRepairComplexityRequest {
  id: string;
  updated_by: string;
}

export interface RepairComplexityFilters {
  is_active?: boolean;
  search?: string;
  store_id?: string;
}

@Injectable({
  providedIn: 'root'
})

export class RepairComplexityApiService {
  private readonly endpoint = '/repair-complexities';

  constructor(private apiService: ApiService) {}

  getAll(filters?: RepairComplexityFilters): Observable<RepairComplexity[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<RepairComplexity[]>(this.endpoint, params)
    .pipe(map(response => response.map(rc => this.mapRepairComplexity(rc))));
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: RepairComplexityFilters): Observable<PaginatedResponse<RepairComplexity>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<PaginatedResponse<RepairComplexity>>(this.endpoint, params);
  }

  getById(id: string): Observable<RepairComplexity> {
    return this.apiService.get<RepairComplexity>(`${this.endpoint}/${id}`)
    .pipe(map(response => this.mapRepairComplexity(response)));
  }

  create(repairComplexityData: CreateRepairComplexityRequest): Observable<RepairComplexity> {
    return this.apiService.post<RepairComplexity>(this.endpoint, repairComplexityData)
    .pipe(map(response => this.mapRepairComplexity(response)));
  }

  update(id: string, repairComplexityData: UpdateRepairComplexityRequest): Observable<RepairComplexity> {
    return this.apiService.put<RepairComplexity>(`${this.endpoint}/${id}`, repairComplexityData)
    .pipe(map(response => this.mapRepairComplexity(response)));
  }

  patch(id: string, repairComplexityData: Partial<UpdateRepairComplexityRequest>): Observable<RepairComplexity> {
    return this.apiService.patch<RepairComplexity>(`${this.endpoint}/${id}`, repairComplexityData)
    .pipe(map(response => this.mapRepairComplexity(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  activate(repair_complexity_data: ActivateRepairComplexityRequest): Observable<boolean> {
    return this.apiService.put<RepairComplexity>(`${this.endpoint}/activate`, repair_complexity_data)
    .pipe(map(() => true));
  }

  deactivate(repair_complexity_data: DeactivateRepairComplexityRequest): Observable<boolean> {
    return this.apiService.put<RepairComplexity>(`${this.endpoint}/deactivate`, repair_complexity_data)
    .pipe(map(() => true));
  }

  getActiveRepairComplexities(): Observable<RepairComplexity[]> {
    return this.getAll({ is_active: true });
  }

  getByStore(storeId: string): Observable<RepairComplexity[]> {
    return this.getAll({ store_id: storeId });
  }

  private mapRepairComplexity(repairComplexity: any): RepairComplexity {
      return {
        id: repairComplexity.id,
        name: repairComplexity.name,
        code: repairComplexity.code,
        laborMultiplier: Number(repairComplexity.labor_multiplier) || 0,
        timeMultiplier: Number(repairComplexity.time_multiplier) || 0,
        storeId: repairComplexity.store_id,
        isActive: repairComplexity.is_active,
        createdAt: repairComplexity.created_at,
        updatedAt: repairComplexity.updated_at};
    }
}
