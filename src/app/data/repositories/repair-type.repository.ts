import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairType } from '../../core/models/repair-type.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { RepairTypeApiService } from '../../core/services/repair-type-api.service';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class RepairTypeRepository implements Repository<RepairType> {
  constructor(private repairTypeApiService: RepairTypeApiService) {}

  getAll(): Observable<RepairType[]> {
    return this.repairTypeApiService.getAll();
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
      created_by: this.getStoredUserId()};
    
    return this.repairTypeApiService.create(createRequest);
  }

  update(id: string, repairType: Partial<RepairType>): Observable<RepairType> {
    const updateRequest = {
      name: repairType.name,
      code: repairType.code,
      estimated_price: repairType.estimatedPrice,
      estimated_time: repairType.estimatedTime,
      updated_by: this.getStoredUserId()};
    
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

  activate(id: string): Observable<boolean> {
    const activateRequest = { 
      id: id, 
      updated_by: this.getStoredUserId()};
    
    return this.repairTypeApiService.activate(activateRequest);
  }

  deactivate(id: string): Observable<boolean> {
    const deactivateRequest = { 
      id: id, 
      updated_by: this.getStoredUserId()};
    
    return this.repairTypeApiService.deactivate(deactivateRequest);
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }
}
