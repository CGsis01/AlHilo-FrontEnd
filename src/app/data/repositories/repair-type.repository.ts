import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairType } from '../../core/models/repair-type.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { RepairTypeApiService } from '../../core/services/repair-type-api.service';
import { getStoredUserId } from '../../shared/utils/userLocalData.utils';

@Injectable({
  providedIn: 'root'
})

export class RepairTypeRepository implements Repository<RepairType> {
  constructor(private repairTypeApiService: RepairTypeApiService) {}

  getAll(): Observable<RepairType[]> {
    return this.repairTypeApiService.getAll();
  }

  getByStore(storeId: string): Observable<RepairType[]> {
    return this.repairTypeApiService.getByStore(storeId);
  }

  getById(id: string): Observable<RepairType> {
    return this.repairTypeApiService.getById(id);
  }

  create(repairType: Partial<RepairType>): Observable<RepairType> {
    const createRequest = {
      name: repairType.name!,
      code: repairType.code!,
      estimated_price: repairType.estimatedPrice!,
      estimated_time: repairType.estimatedTime!,
      repair_complexity_id: repairType.repairComplexity?.id,
      store_id: repairType.store?.id,
      created_by: getStoredUserId()};
    
    return this.repairTypeApiService.create(createRequest);
  }

  update(id: string, repairType: Partial<RepairType>): Observable<RepairType> {
    const updateRequest = {
      name: repairType.name,
      code: repairType.code,
      estimated_price: repairType.estimatedPrice,
      estimated_time: repairType.estimatedTime,
      repair_complexity_id: repairType.repairComplexity?.id,
      updated_by: getStoredUserId()};
    
    return this.repairTypeApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.repairTypeApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  activate(id: string, storeId: string): Observable<boolean> {
    const activateRequest = { 
      id: id, 
      store_id: storeId,
      updated_by: getStoredUserId()};
    
    return this.repairTypeApiService.activate(activateRequest);
  }

  deactivate(id: string, storeId: string): Observable<boolean> {
    const deactivateRequest = { 
      id: id, 
      store_id: storeId,
      updated_by: getStoredUserId()};
    
    return this.repairTypeApiService.deactivate(deactivateRequest);
  }

}
