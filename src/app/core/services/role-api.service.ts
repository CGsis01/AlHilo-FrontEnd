import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { Role } from '../models/role.model';
import { PaginatedResponse } from '../interfaces/api-response.interface';

export interface CreateRoleRequest {
  name: string;
  code: string;
  is_active?: boolean;
}

export interface UpdateRoleRequest {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export interface ActivateRoleRequest {
  id: string;
  updated_by: string;
}

export interface DeactivateRoleRequest {
  id: string;
  updated_by: string;
}

export interface RoleFilters {
  is_active?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})

export class RoleApiService {
  private readonly endpoint = '/roles';

  constructor(private apiService: ApiService) {}

  getAll(filters?: RoleFilters): Observable<Role[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.apiService.get<Role[]>(this.endpoint, params)
    .pipe(map(response => response.map(r => this.mapRole(r))));
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: RoleFilters): Observable<PaginatedResponse<Role>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.apiService.get<PaginatedResponse<Role>>(this.endpoint, params);
  }

  getById(id: string): Observable<Role> {
    return this.apiService.get<Role>(`${this.endpoint}/${id}`)
    .pipe(map(response => this.mapRole(response)));
  }

  create(roleData: CreateRoleRequest): Observable<Role> {
    return this.apiService.post<Role>(this.endpoint, roleData)
    .pipe(map(response => this.mapRole(response)));
  }

  update(id: string, roleData: UpdateRoleRequest): Observable<Role> {
    return this.apiService.put<Role>(`${this.endpoint}/${id}`, roleData)
    .pipe(map(response => this.mapRole(response)));
  }

  patch(id: string, roleData: Partial<UpdateRoleRequest>): Observable<Role> {
    return this.apiService.patch<Role>(`${this.endpoint}/${id}`, roleData)
    .pipe(map(response => this.mapRole(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  activate(role_data: ActivateRoleRequest): Observable<boolean> {
    return this.apiService.put<Role>(`${this.endpoint}/activate`, role_data)
    .pipe(map(() => true));
  }

  deactivate(role_data: DeactivateRoleRequest): Observable<boolean> {
    return this.apiService.put<Role>(`${this.endpoint}/deactivate`, role_data)
    .pipe(map(() => true));
  }

  getActiveRoles(): Observable<Role[]> {
    return this.getAll({ is_active: true })
    .pipe(map(response => response.map(r => this.mapRole(r))));
  }

  private mapRole(role: any): Role {
      return {
        id: role.id,
        name: role.name,
        code: role.code,
        isActive: role.is_active,
        createdAt: role.created_at,
        updatedAt: role.updated_at};
    }
}
