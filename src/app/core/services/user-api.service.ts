import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { User, UserRole, UserRoleCode } from '../../core/models/user.model';
import { PaginatedResponse } from '../../core/interfaces/api-response.interface';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role_id: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role_id?: string;
  is_active?: boolean;
}

export interface ActivateUserRequest {
  id: string;
  updated_by: string;
}

export interface DeactivateUserRequest {
  id: string;
  updated_by: string;
}

export interface UserFilters {
  role_id?: string;
  role_code?: string;
  role_codes?: string[];
  store_id?: string;
  is_active?: boolean;
  search?: string;  // Name or email search
}

@Injectable({
  providedIn: 'root'
})

export class UserApiService {
  private readonly endpoint = '/users';

  constructor(private apiService: ApiService) {}

  getAll(filters?: UserFilters): Observable<User[]> {
    let params = '';

    if (filters) {
      if (filters.role_id) params = `role_id=${filters.role_id}`;
      if (filters.is_active !== undefined) 
        params = params 
          ? `${params}&is_active=${filters.is_active.toString()}` 
          : `is_active=${filters.is_active.toString()}`;
      if (filters.search) 
        params = params 
          ? `${params}&search=${filters.search}` 
          : `search=${filters.search}`;
      if (filters.role_code) 
        params = params 
          ? `${params}&role_code=${filters.role_code}`
          : `role_code=${filters.role_code}`;
      if (filters.role_codes) {
        const roleCodesParam = filters.role_codes.map(code => `role_codes=${code}`).join('&');
        
        params = params 
          ? `${params}&${roleCodesParam}` 
          : roleCodesParam;
      }
      if (filters.store_id) 
        params = params 
          ? `${params}&store_id=${filters.store_id}` 
          : `store_id=${filters.store_id}`;
    }

    return this.apiService.get<User[]>(`${this.endpoint}?${params}`)
    .pipe(map(response => response.map(u => this.mapUser(u))));
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: UserFilters): Observable<PaginatedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.role_id) params = params.set('role_id', filters.role_id);
      if (filters.role_code) params = params.set('role_code', filters.role_code);
      if (filters.is_active !== undefined) params = params.set('is_active', filters.is_active.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
      if (filters.role_codes) { filters.role_codes.forEach(code => { params = params.append('role_codes', code); }); }
    }

    return this.apiService.get<PaginatedResponse<User>>(this.endpoint, params);
  }

  getById(id: string): Observable<User> {
    return this.apiService.get<User>(`${this.endpoint}/${id}`);
  }

  getByRole(roles: UserRole[]): Observable<User[]> {
    const roleCodes = roles.map(role => role.code);
    
    return this.getAll({ role_codes: roleCodes });
  }

  getByStore(storeId: string): Observable<User[]> {
    return this.getAll({ store_id: storeId });
  }

  create(userData: CreateUserRequest): Observable<User> {
    return this.apiService.post<User>(this.endpoint, userData)
    .pipe(map(response => this.mapUser(response)));
  }

  update(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.apiService.put<User>(`${this.endpoint}/${id}`, userData)
    .pipe(map(response => this.mapUser(response)));
  }

  patch(id: string, userData: Partial<UpdateUserRequest>): Observable<User> {
    return this.apiService.patch<User>(`${this.endpoint}/${id}`, userData)
    .pipe(map(response => this.mapUser(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  activate(user_data: ActivateUserRequest): Observable<boolean> {
    return this.apiService.put<User>(`${this.endpoint}/activate`, user_data)
    .pipe(map(() => true));
  }

  deactivate(user_data: DeactivateUserRequest): Observable<boolean> {
    return this.apiService.put<User>(`${this.endpoint}/deactivate`, user_data)
    .pipe(map(() => true));
  }

  getActiveSeamstresses(): Observable<User[]> {
    return this.getAll({ role_code: UserRoleCode.SEAMSTRESS, is_active: true });
  }

  private mapUser(user: any): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: { id: user.role.id, name: user.role.name, code: user.role.code } as UserRole,
      store: user.store ? {
        id: user.store.id,
        name: user.store.name,
        address: user.store.address,
        phone: user.store.phone,
        email: user.store.email,
        rfc: user.store.rfc,
        url: user.store.url,
        logo: user.store.logo,
        isActive: user.store.is_active,
        createdAt: new Date(user.store.created_at),
        updatedAt: new Date(user.store.updated_at)
      } : null,
      isActive: user.is_active,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)};
    }
}
