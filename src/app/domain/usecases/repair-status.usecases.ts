import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairStatusRepository } from '../../data/repositories/repair-status.repository';
import { RepairStatus } from '../../core/models/repair-status.model';

@Injectable({
  providedIn: 'root'
})

export class RepairStatusUseCases {
  constructor(private repairStatusRepository: RepairStatusRepository) {}

  getAllRepairStatuses(): Observable<RepairStatus[]> {
    return this.repairStatusRepository.getAll();
  }

  getRepairStatusById(id: string): Observable<RepairStatus> {
    return this.repairStatusRepository.getById(id);
  }
}
