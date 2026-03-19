import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StoreRepository } from '../../data/repositories/store.repository';
import { Store } from '../../core/models/store.model';

@Injectable({
  providedIn: 'root'
})

export class StoreUseCases {
  constructor(private storeRepository: StoreRepository) {}

  getAllStores(): Observable<Store[]> {
    return this.storeRepository.getAll();
  }

  getStoreById(id: string): Observable<Store> {
    return this.storeRepository.getById(id);
  }

  createStore(store: Partial<Store>): Observable<Store> {
    return this.storeRepository.create(store);
  }

  updateStore(id: string, store: Partial<Store>): Observable<Store> {
    return this.storeRepository.update(id, store);
  }

  deleteStore(id: string): Observable<boolean> {
    return this.storeRepository.delete(id);
  }

  getActiveStores(): Observable<Store[]> {
    return this.storeRepository.getActiveStores();
  }

  activateStore(id: string): Observable<boolean> {
    return this.storeRepository.activate(id);
  }

  deactivateStore(id: string): Observable<boolean> {
    return this.storeRepository.deactivate(id);
  }
}
