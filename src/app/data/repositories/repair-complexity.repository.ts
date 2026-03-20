import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairComplexity } from '../../core/models/repair-complexity.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { RepairComplexityApiService } from '../../core/services/repair-complexity-api.service';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class RepairComplexityRepository implements Repository<RepairComplexity> {
  constructor(private repairComplexityApiService: RepairComplexityApiService) {}

  getAll(): Observable<RepairComplexity[]> {
    return this.repairComplexityApiService.getAll();
  }

  getById(id: string): Observable<RepairComplexity> {
    return this.repairComplexityApiService.getById(id);
  }

  create(repairComplexity: Partial<RepairComplexity>): Observable<RepairComplexity> {
    const createRequest = {
      name: repairComplexity.name!,
      code: repairComplexity.code!,
      labor_multiplier: repairComplexity.laborMultiplier!,
      time_multiplier: repairComplexity.timeMultiplier!,
      store_id: repairComplexity.storeId!,
      created_by: this.getStoredUserId()};
    
    return this.repairComplexityApiService.create(createRequest);
  }

  update(id: string, repairComplexity: Partial<RepairComplexity>): Observable<RepairComplexity> {
    const updateRequest = {
      name: repairComplexity.name,
      code: repairComplexity.code,
      labor_multiplier: repairComplexity.laborMultiplier,
      time_multiplier: repairComplexity.timeMultiplier,
      store_id: repairComplexity.storeId,
      updated_by: this.getStoredUserId()};
    
    return this.repairComplexityApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.repairComplexityApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  getActiveRepairComplexities(): Observable<RepairComplexity[]> {
    return this.repairComplexityApiService.getActiveRepairComplexities();
  }

  getRepairComplexitiesByStore(storeId: string): Observable<RepairComplexity[]> {
    return this.repairComplexityApiService.getByStore(storeId);
  }

  activate(id: string): Observable<boolean> {
    const activateRequest = {
      id: id,
      updated_by: this.getStoredUserId()}

    return this.repairComplexityApiService.activate(activateRequest);
  }

  deactivate(id: string): Observable<boolean> {
    const deactivateRequest = {
      id: id,
      updated_by: this.getStoredUserId()}

    return this.repairComplexityApiService.deactivate(deactivateRequest);
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }
}
