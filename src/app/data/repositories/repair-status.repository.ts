import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairStatus } from '../../core/models/repair-status.model';
import { RepairStatusApiService } from '../../core/services/repair-status-api.service';

@Injectable({
  providedIn: 'root'
})

export class RepairStatusRepository {
  constructor(private repairStatusApiService: RepairStatusApiService) {}

  getAll(): Observable<RepairStatus[]> {
    return this.repairStatusApiService.getAll();
  }

  getById(id: string): Observable<RepairStatus> {
    return this.repairStatusApiService.getById(id);
  }
}
