import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Store } from '../models/store.model';
import { PaginatedResponse } from '../interfaces/api-response.interface';

export interface CreateStoreRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  rfc?: string;
  url?: string;
  logo?: string;
  created_by: string;
}

export interface UpdateStoreRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  rfc?: string;
  url?: string;
  logo?: string;
  updated_by: string;
}

export interface ActivateStoreRequest {
  id: string;
  updated_by: string;
}

export interface DeactivateStoreRequest {
  id: string;
  updated_by: string;
}

export interface StoreFilters {
  is_active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})

export class StoreApiService {
  private readonly endpoint = '/stores';

  constructor(private apiService: ApiService) {}

  getAll(filters?: StoreFilters): Observable<Store[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.apiService.get<Store[]>(this.endpoint, params)
    .pipe(map(response => response.map(s => this.mapStore(s))));
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: StoreFilters): Observable<PaginatedResponse<Store>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.apiService.get<PaginatedResponse<Store>>(this.endpoint, params);
  }

  getById(id: string): Observable<Store> {
    return this.apiService.get<Store>(`${this.endpoint}/${id}`)
    .pipe(map(response => this.mapStore(response)));
  }

  create(storeData: CreateStoreRequest): Observable<Store> {
    return this.apiService.post<Store>(this.endpoint, storeData)
    .pipe(map(response => this.mapStore(response)));
  }

  update(id: string, storeData: UpdateStoreRequest): Observable<Store> {
    return this.apiService.put<Store>(`${this.endpoint}/${id}`, storeData)
    .pipe(map(response => this.mapStore(response)));
  }

  patch(id: string, storeData: Partial<UpdateStoreRequest>): Observable<Store> {
    return this.apiService.patch<Store>(`${this.endpoint}/${id}`, storeData)
    .pipe(map(response => this.mapStore(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  activate(store_data: ActivateStoreRequest): Observable<boolean> {
    return this.apiService.put<Store>(`${this.endpoint}/activate`, store_data)
    .pipe(map(() => true));
  }

  deactivate(store_data: DeactivateStoreRequest): Observable<boolean> {
    return this.apiService.put<Store>(`${this.endpoint}/deactivate`, store_data)
    .pipe(map(() => true));
  }

  getActiveStores(): Observable<Store[]> {
    return this.getAll({ is_active: true })
    .pipe(map(response => response.map(s => this.mapStore(s))));
  }

  private mapStore(store: any): Store {
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email,
        rfc: store.rfc,
        url: store.url,
        logo: store.logo,
        isActive: store.is_active,
        createdAt: store.created_at,
        updatedAt: store.updated_at};
    }
}
