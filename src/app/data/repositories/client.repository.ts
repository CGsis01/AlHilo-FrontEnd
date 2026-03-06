import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Client } from '../../core/models/client.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { ClientApiService } from '../../core/services/client-api.service';

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
      birth_date: client.birthDate ? client.birthDate.toISOString().split('T')[0] : undefined};
    
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
      birth_date: client.birthDate ? client.birthDate.toISOString().split('T')[0] : undefined};
    
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
    return this.clientApiService.searchByPhone(phone)
    .pipe(map(client => client || undefined));
  }
}
