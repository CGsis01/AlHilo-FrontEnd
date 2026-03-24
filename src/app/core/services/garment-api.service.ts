import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Garment, GarmentRepairType } from '../models/garment.model';

export interface CreateGarmentRequest {
  name: string;
  code: string;
  description?: string;
  category?: string;
  store_id: string;
  created_by: string;
}

export interface UpdateGarmentRequest {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  store_id?: string;
  updated_by: string;
}

export interface ActivateGarmentRequest {
  id: string;
  updated_by: string;
}

export interface DeactivateGarmentRequest {
  id: string;
  updated_by: string;
}

export interface GarmentFilters {
  store_id?: string;
}

export interface AddRepairTypeToGarmentRequest {
  garment_id: string;
  repair_type_id: string;
  store_id: string;
  is_default?: boolean;
  estimated_price_override?: number;
  estimated_time_override?: number;
  sort_order?: number;
  created_by: string;
}

export interface UpdateGarmentRepairTypeRequest {
  is_default?: boolean;
  estimated_price_override?: number;
  estimated_time_override?: number;
  sort_order?: number;
  updated_by: string;
}

@Injectable({
  providedIn: 'root'
})

export class GarmentApiService {
  private readonly apiUrl = '/garments';

  constructor(private apiService: ApiService) {}

  getAll(filters?: GarmentFilters): Observable<Garment[]> {
    let params = new HttpParams();
    
    if (filters?.store_id) {
      params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<Garment[]>(this.apiUrl, params).pipe(
      map(response => response.map(g => this.mapGarment(g)))
    );
  }

  getById(id: string): Observable<Garment> {
    return this.apiService.get<Garment>(`${this.apiUrl}/${id}`).pipe(
      map(garment => this.mapGarment(garment))
    );
  }

  getByStore(storeId: string): Observable<Garment[]> {
    return this.getAll({ store_id: storeId });
  }

  getActiveGarments(storeId?: string): Observable<Garment[]> {
    return this.getAll({ store_id: storeId }).pipe(
      map(garments => garments.filter(g => g.isActive))
    );
  }

  create(garment: CreateGarmentRequest): Observable<Garment> {
    return this.apiService.post<Garment>(this.apiUrl, garment).pipe(
      map(g => this.mapGarment(g))
    );
  }

  update(id: string, garment: UpdateGarmentRequest): Observable<Garment> {
    return this.apiService.put<Garment>(`${this.apiUrl}/${id}`, garment).pipe(
      map(g => this.mapGarment(g))
    );
  }

  activate(request: ActivateGarmentRequest): Observable<boolean> {
    return this.apiService.put<boolean>(`${this.apiUrl}/activate`, request);
  }

  deactivate(request: DeactivateGarmentRequest): Observable<boolean> {
    return this.apiService.put<boolean>(`${this.apiUrl}/deactivate`, request);
  }

  // Repair Type Relationship Methods
  addRepairType(garmentId: string, request: AddRepairTypeToGarmentRequest): Observable<GarmentRepairType> {
    return this.apiService.post<GarmentRepairType>(
      `${this.apiUrl}/${garmentId}/repair-types`,
      request
    ).pipe(
      map(rt => this.mapGarmentRepairType(rt))
    );
  }

  getGarmentRepairTypes(garmentId: string, storeId: string): Observable<GarmentRepairType[]> {
    const params = new HttpParams().set('store_id', storeId);
    
    return this.apiService.get<GarmentRepairType[]>(
      `${this.apiUrl}/${garmentId}/repair-types`,
      params
    ).pipe(
      map(response => response.map(rt => this.mapGarmentRepairType(rt)))
    );
  }

  updateGarmentRepairType(
    garmentId: string,
    repairTypeId: string,
    storeId: string,
    request: UpdateGarmentRepairTypeRequest
  ): Observable<GarmentRepairType> {
    const params = new HttpParams().set('store_id', storeId);
    
    return this.apiService.put<GarmentRepairType>(
      `${this.apiUrl}/${garmentId}/repair-types/${repairTypeId}`,
      request
    ).pipe(
      map(rt => this.mapGarmentRepairType(rt))
    );
  }

  private mapGarment(garment: any): Garment {
    return {
      id: garment.id,
      name: garment.name,
      code: garment.code,
      description: garment.description,
      category: garment.category,
      storeId: garment.store_id,
      isActive: garment.is_active,
      createdAt: new Date(garment.created_at),
      updatedAt: new Date(garment.updated_at),
      repairTypes: garment.repair_types?.map((rt: any) => this.mapGarmentRepairType(rt)) || []
    };
  }

  private mapGarmentRepairType(rt: any): GarmentRepairType {
    return {
      repairTypeId: rt.id,
      repairTypeName: rt.repair_type_name,
      repairTypeCode: rt.repair_type_code,
      isDefault: rt.is_default,
      estimatedPriceOverride: rt.estimated_price_override,
      estimatedTimeOverride: rt.estimated_time_override,
      sortOrder: rt.sort_order,
      isActive: rt.is_active
    };
  }
}
