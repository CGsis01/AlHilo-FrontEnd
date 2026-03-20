import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairComplexityRepository } from '../../data/repositories/repair-complexity.repository';
import { RepairComplexity } from '../../core/models/repair-complexity.model';

@Injectable({
  providedIn: 'root'
})

export class RepairComplexityUseCases {
  constructor(private repairComplexityRepository: RepairComplexityRepository) {}

  getAllRepairComplexities(): Observable<RepairComplexity[]> {
    return this.repairComplexityRepository.getAll();
  }

  getRepairComplexityById(id: string): Observable<RepairComplexity> {
    return this.repairComplexityRepository.getById(id);
  }

  createRepairComplexity(repairComplexity: Partial<RepairComplexity>): Observable<RepairComplexity> {
    return this.repairComplexityRepository.create(repairComplexity);
  }

  updateRepairComplexity(id: string, repairComplexity: Partial<RepairComplexity>): Observable<RepairComplexity> {
    return this.repairComplexityRepository.update(id, repairComplexity);
  }

  deleteRepairComplexity(id: string): Observable<boolean> {
    return this.repairComplexityRepository.delete(id);
  }

  getActiveRepairComplexities(): Observable<RepairComplexity[]> {
    return this.repairComplexityRepository.getActiveRepairComplexities();
  }

  getRepairComplexitiesByStore(storeId: string): Observable<RepairComplexity[]> {
    return this.repairComplexityRepository.getRepairComplexitiesByStore(storeId);
  }

  activateRepairComplexity(id: string): Observable<boolean> {
    return this.repairComplexityRepository.activate(id);
  }

  deactivateRepairComplexity(id: string): Observable<boolean> {
    return this.repairComplexityRepository.deactivate(id);
  }
}
