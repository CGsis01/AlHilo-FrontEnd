import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { RepairStatus } from '../models/repair-status.model';

@Injectable({
  providedIn: 'root'
})

export class RepairStatusApiService {
  private readonly endpoint = '/repair-status';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<RepairStatus[]> {
    return this.apiService.get<RepairStatus[]>(this.endpoint)
    .pipe(map(response => response.map(rt => this.mapRepairStatus(rt))));
  }

  getById(id: string): Observable<RepairStatus> {
    return this.apiService.get<RepairStatus>(`${this.endpoint}/${id}`);
  }

  private mapRepairStatus(repairStatus: any): RepairStatus {
    return {
      id: repairStatus.repair_status_id,    
      name: repairStatus.name};
  }
}
