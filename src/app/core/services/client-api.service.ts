import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Client } from '../../core/models/client.model';
import { PaginatedResponse } from '../../core/interfaces/api-response.interface';

// DTOs for client requests
export interface CreateClientRequest {
  full_name: string;
  address: string;
  personal_phone: string;
  contact_phone: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  birth_date?: string;  // ISO date string
}

export interface UpdateClientRequest {
  full_name?: string;
  address?: string;
  personal_phone?: string;
  contact_phone?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  birth_date?: string;  // ISO date string
}

export interface ClientFilters {
  search?: string;  // Search by name, phone, or email
  phone?: string;   // Specific phone search
  store_id?: string; // Filter by store
}

@Injectable({
  providedIn: 'root'
})

export class ClientApiService {
  private readonly endpoint = '/clients';

  constructor(private apiService: ApiService) {}

  getAll(filters?: ClientFilters): Observable<Client[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.phone) params = params.set('phone', filters.phone);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<Client[]>(this.endpoint, params)
    .pipe(map((response: Client[]) => response.map(client => this.mapClient(client))));
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: ClientFilters): Observable<PaginatedResponse<Client>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.phone) params = params.set('phone', filters.phone);
      if (filters.store_id) params = params.set('store_id', filters.store_id);
    }

    return this.apiService.get<PaginatedResponse<Client>>(this.endpoint, params);
  }

  getById(id: string): Observable<Client> {
    return this.apiService.get<Client>(`${this.endpoint}/${id}`)
    .pipe(map((response: Client) => this.mapClient(response)));
  }

  getByStore(storeId: string): Observable<Client[]> {
    return this.getAll({ store_id: storeId });
  }

  searchByPhone(phone: string, storeId?: string): Observable<Client | null> {
    let params = new HttpParams();
    
    if (storeId) {
      params = params.set('store_id', storeId);
    }
    
    return this.apiService.get<Client | null>(`${this.endpoint}/by-phone/${phone}`, params)
    .pipe(map((response: Client | null) => response ? this.mapClient(response) : null));
  }

  searchByName(name: string): Observable<Client[]> {
    const params = new HttpParams().set('name', name);

    return this.apiService.get<Client[]>(`${this.endpoint}/search/name`, params)
    .pipe(map((response: Client[]) => response.map(client => this.mapClient(client))));
  }

  create(clientData: CreateClientRequest): Observable<Client> {
    return this.apiService.post<Client>(this.endpoint, clientData)
    .pipe(map((response: Client) => this.mapClient(response)));
  }

  update(id: string, clientData: UpdateClientRequest): Observable<Client> {
    return this.apiService.put<Client>(`${this.endpoint}/${id}`, clientData)
    .pipe(map((response: Client) => this.mapClient(response)));
  }

  patch(id: string, clientData: Partial<UpdateClientRequest>): Observable<Client> {
    return this.apiService.patch<Client>(`${this.endpoint}/${id}`, clientData)
    .pipe(map((response: Client) => this.mapClient(response)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  getRepairHistory(id: string): Observable<any[]> {
    return this.apiService.get<any[]>(`${this.endpoint}/${id}/repairs`);
  }

  getUpcomingBirthdays(days: number = 30): Observable<Client[]> {
    const params = new HttpParams().set('days', days.toString());
    
    return this.apiService.get<Client[]>(`${this.endpoint}/birthdays/upcoming`, params);
  }

  private mapClient(client: any): Client {
      return {
        id: client.id,
        fullName: client.full_name,
        address: client.address,
        personalPhone: client.personal_phone,
        contactPhone: client.contact_phone,
        email: client.email,
        facebook: client.facebook,
        instagram: client.instagram,
        birthDate: client.birth_date,
        store: client.store ? {
          id: client.store.id,
          name: client.store.name,
          address: client.store.address,
          phone: client.store.phone,
          email: client.store.email,
          rfc: client.store.rfc,
          url: client.store.url,
          logo: client.store.logo,
          isActive: client.store.is_active,
          createdAt: client.store.created_at,
          updatedAt: client.store.updated_at
        } : undefined,
        createdAt: client.created_at,
        updatedAt: client.updated_at};
    }
}
