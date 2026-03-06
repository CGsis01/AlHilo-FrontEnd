import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairTypeRepository } from '../../data/repositories/repair-type.repository';
import { RepairType } from '../../core/models/repair-type.model';

@Injectable({
  providedIn: 'root'
})

export class RepairTypeUseCases {
  constructor(private repairTypeRepository: RepairTypeRepository) {}

  getAllRepairTypes(): Observable<RepairType[]> {
    return this.repairTypeRepository.getAll();
  }

  getRepairTypeById(id: string): Observable<RepairType> {
    return this.repairTypeRepository.getById(id);
  }

  createRepairType(repairType: Partial<RepairType>): Observable<RepairType> {
    return this.repairTypeRepository.create(repairType);
  }

  updateRepairType(id: string, repairType: Partial<RepairType>): Observable<RepairType> {
    return this.repairTypeRepository.update(id, repairType);
  }

  deleteRepairType(id: string): Observable<boolean> {
    return this.repairTypeRepository.delete(id);
  }

  activateRepairType(id: string): Observable<boolean> {
    return this.repairTypeRepository.activate(id);
  }

  deactivateRepairType(id: string): Observable<boolean> {
    return this.repairTypeRepository.deactivate(id);
  }
}
