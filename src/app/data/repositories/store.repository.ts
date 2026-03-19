import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '../../core/models/store.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { StoreApiService } from '../../core/services/store-api.service';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class StoreRepository implements Repository<Store> {
  constructor(private storeApiService: StoreApiService) {}

  getAll(): Observable<Store[]> {
    return this.storeApiService.getAll();
  }

  getById(id: string): Observable<Store> {
    return this.storeApiService.getById(id);
  }

  create(store: Partial<Store>): Observable<Store> {
    const createRequest = {
      name: store.name!,
      address: store.address,
      phone: store.phone,
      email: store.email,
      rfc: store.rfc,
      url: store.url,
      logo: store.logo,
      created_by: this.getStoredUserId()};
    
    return this.storeApiService.create(createRequest);
  }

  update(id: string, store: Partial<Store>): Observable<Store> {
    const updateRequest = {
      name: store.name,
      address: store.address,
      phone: store.phone,
      email: store.email,
      rfc: store.rfc,
      url: store.url,
      logo: store.logo,
      updated_by: this.getStoredUserId()};
    
    return this.storeApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.storeApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  getActiveStores(): Observable<Store[]> {
    return this.storeApiService.getActiveStores();
  }

  activate(id: string): Observable<boolean> {
    const activateRequest = {
      id: id,
      updated_by: this.getStoredUserId()}

    return this.storeApiService.activate(activateRequest);
  }

  deactivate(id: string): Observable<boolean> {
    const deactivateRequest = {
      id: id,
      updated_by: this.getStoredUserId()}

    return this.storeApiService.deactivate(deactivateRequest);
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }
}
