import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Material } from '../../core/models/material.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { MaterialApiService } from '../../core/services/material-api.service';
import { getStoredUserId } from '../../shared/utils/userLocalData.utils';

@Injectable({
  providedIn: 'root'
})

export class MaterialRepository implements Repository<Material> {
  constructor(private materialApiService: MaterialApiService) {}

  getAll(): Observable<Material[]> {
    return this.materialApiService.getAll();
  }

  getById(id: string): Observable<Material> {
    return this.materialApiService.getById(id);
  }

  create(material: Partial<Material>): Observable<Material> {
    const createRequest = {
      name: material.name!,
      unit: material.unit!,
      unit_cost: material.unitCost!,
      store_id: material.storeId!,
      created_by: getStoredUserId()};
    
    return this.materialApiService.create(createRequest);
  }

  update(id: string, material: Partial<Material>): Observable<Material> {
    const updateRequest = {
      name: material.name,
      unit: material.unit,
      unit_cost: material.unitCost,
      store_id: material.storeId,
      updated_by: getStoredUserId()};
    
    return this.materialApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.materialApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  getActiveMaterials(storeId?: string): Observable<Material[]> {
    return this.materialApiService.getActiveMaterials(storeId);
  }

  getByStore(storeId: string): Observable<Material[]> {
    return this.materialApiService.getByStore(storeId);
  }

  activate(id: string, storeId: string): Observable<boolean> {
    const activateRequest = {
      id: id,
      store_id: storeId,
      updated_by: getStoredUserId()}

    return this.materialApiService.activate(activateRequest);
  }

  deactivate(id: string, storeId: string): Observable<boolean> {
    const deactivateRequest = {
      id: id,
      store_id: storeId,
      updated_by: getStoredUserId()}

    return this.materialApiService.deactivate(deactivateRequest);
  }

}
