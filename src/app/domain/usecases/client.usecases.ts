import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClientRepository } from '../../data/repositories/client.repository';
import { Client } from '../../core/models/client.model';

@Injectable({
  providedIn: 'root'
})

export class ClientUseCases {
  constructor(private clientRepository: ClientRepository) {}

  getAllClients(): Observable<Client[]> {
    return this.clientRepository.getAll();
  }

  getClientById(id: string): Observable<Client> {
    return this.clientRepository.getById(id);
  }

  getClientsByStore(storeId: string): Observable<Client[]> {
    return this.clientRepository.getByStore(storeId);
  }

  createClient(client: Partial<Client>): Observable<Client> {
    return this.clientRepository.create(client);
  }

  updateClient(id: string, client: Partial<Client>): Observable<Client> {
    return this.clientRepository.update(id, client);
  }

  deleteClient(id: string, storeId?: string): Observable<boolean> {
    return this.clientRepository.delete(id, storeId);
  }

  searchByPhone(phone: string): Observable<Client | undefined> {
    return this.clientRepository.searchByPhone(phone);
  }
}
