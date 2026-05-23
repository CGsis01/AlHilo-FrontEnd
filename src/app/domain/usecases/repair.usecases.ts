import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairRepository } from '../../data/repositories/repair.repository';
import { Repair } from '../../core/models/repair.model';
import { RepairItem } from '../../core/models/repair-item.model';
import { RepairStatus } from '../../core/models/repair-status.model';
import { User } from '../../core/models/user.model';
import { PaginatedResponse } from '../../core/interfaces/api-response.interface';
import { RepairComment } from '@core/models/repair-comment.model';

@Injectable({
  providedIn: 'root'
})

export class RepairUseCases {
  constructor(private repairRepository: RepairRepository) {}

  createRepair(repair: Partial<Repair>): Observable<Repair> {
    return this.repairRepository.create(repair);
  }

  updateRepair(id: string, repair: Partial<Repair>): Observable<Repair> {
    return this.repairRepository.update(id, repair);
  }

  deleteRepair(id: string): Observable<boolean> {
    return this.repairRepository.delete(id);
  }

  getAllRepairs(): Observable<Repair[]> {
    return this.repairRepository.getAll();
  }

  getRepairById(id: string): Observable<Repair> {
    return this.repairRepository.getById(id);
  }

  getRepairsPaginated(page: number, pageSize: number): Observable<PaginatedResponse<Repair>> {
    return this.repairRepository.getPaginated(page, pageSize);
  }

  getRepairsByStatus(status: string): Observable<Repair[]> {
    return this.repairRepository.getByStatus(status);
  }

  getRepairsByAssignedUser(userId: string): Observable<Repair[]> {
    return this.repairRepository.getByAssignedUser(userId);
  }

  getRepairsEstimatedTime(): Observable<number> {
    return this.repairRepository.getEstimatedTime();
  }

  assignRepairToSeamstress(repairId: string, seamstress: User): Observable<Repair> {
    return this.repairRepository.assignToSeamstress(repairId, seamstress);
  }

  updateRepairStatus(repairId: string, status: RepairStatus): Observable<Repair> {
    return this.repairRepository.updateStatus(repairId, status);
  }

  updateRepairItemStatus(itemId: string, status: RepairStatus): Observable<Repair> {
    return this.repairRepository.updateItemStatus(itemId, status);
  }

  addRepairItem(repairId: string, item: Partial<RepairItem>): Observable<RepairItem> {
    return this.repairRepository.addItem(repairId, item);
  }

  updateRepairItem(repairId: string, itemId: string, item: Partial<RepairItem>): Observable<RepairItem> {
    return this.repairRepository.updateItem(repairId, itemId, item);
  }

  removeRepairItem(repairId: string, itemId: string): Observable<void> {
    return this.repairRepository.removeItem(repairId, itemId);
  }

  addComment(repairId: string, comment: string, createdBy: string): Observable<RepairComment> {
    return this.repairRepository.addComment(repairId, comment, createdBy);
  }

  getComments(repairId: string): Observable<RepairComment[]> {
    return this.repairRepository.getComments(repairId);
  }

  getRepairItemsBySeamstress(userId: string): Observable<RepairItem[]> {
    return this.repairRepository.getItemsBySeamstress(userId);
  }

  assignRepairGarments(repairId: string, assignments: Array<{itemId: string, seamstressId?: string}>): Observable<Repair> {
    return this.repairRepository.assignRepairGarments(repairId, assignments);
  }

  assignRepairItem(itemId: string, seamstressId: string): Observable<RepairItem> {
    return this.repairRepository.assignRepairItem(itemId, seamstressId);
  }
}
