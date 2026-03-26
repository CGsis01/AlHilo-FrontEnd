import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Client } from '../../core/models/client.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { ClientApiService } from '../../core/services/client-api.service';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class ClientRepository implements Repository<Client> {

  constructor(
    private clientApiService: ClientApiService
  ) {}

  getAll(): Observable<Client[]> {
    return this.clientApiService.getAll();
  }

  getById(id: string): Observable<Client> {
    return this.clientApiService.getById(id);
  }

  getByStore(storeId: string): Observable<Client[]> {    
    return this.clientApiService.getByStore(storeId);
  }

  create(client: Partial<Client>): Observable<Client> {
    // Map Client model to CreateClientRequest
    const createRequest = {
      full_name: client.fullName!,
      address: client.address!,
      personal_phone: client.personalPhone!,
      contact_phone: client.contactPhone!,
      email: client.email,
      facebook: client.facebook,
      instagram: client.instagram,
      birth_date: client.birthDate ? client.birthDate.toISOString().split('T')[0] : undefined,
      store_id: this.getStoredStoreId(),
      created_by: this.getStoredUserId() };
    
    return this.clientApiService.create(createRequest);
  }

  update(id: string, client: Partial<Client>): Observable<Client> {
    // Map Client model to UpdateClientRequest
    const updateRequest = {
      full_name: client.fullName,
      address: client.address,
      personal_phone: client.personalPhone,
      contact_phone: client.contactPhone,
      email: client.email,
      facebook: client.facebook,
      instagram: client.instagram,
      birth_date: client.birthDate ? client.birthDate.toISOString().split('T')[0] : undefined,
      store_id: client.store?.id,
      updated_by: this.getStoredUserId()};
    
    return this.clientApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.clientApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  searchByPhone(phone: string): Observable<Client | undefined> {
    const storeId = this.getStoredStoreId();

    return this.clientApiService.searchByPhone(phone, storeId)
    .pipe(map(client => client || undefined));
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }

  private getStoredStoreId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).store?.id || '';
  }
}
