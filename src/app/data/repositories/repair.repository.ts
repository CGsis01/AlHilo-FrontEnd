import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Repair, RepairStatusEnum } from '../../core/models/repair.model';
import { RepairItem } from '../../core/models/repair-item.model';
import { User } from '../../core/models/user.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { PaginatedResponse } from '../../core/interfaces/api-response.interface';
import { RepairApiService, RepairItemRequest } from '../../core/services/repair-api.service';
import { getStoredUserId } from '../../shared/utils/userLocalData.utils';
import { RepairStatus } from '@core/models/repair-status.model';
import { RepairComment } from '@core/models/repair-comment.model';

@Injectable({
  providedIn: 'root'
})

export class RepairRepository implements Repository<Repair> {
  constructor(
    private repairApiService: RepairApiService
  ) {}

  getAll(): Observable<Repair[]> {
    return this.repairApiService.getAll();
  }

  getById(id: string): Observable<Repair> {
    return this.repairApiService.getById(id);
  }

  create(repair: Partial<Repair>): Observable<Repair> {
    const nowIso = new Date().toISOString();
    
    // Map Repair model to CreateRepairRequest
    const createRequest = {
      customer_name: repair.customerName!,
      customer_phone: repair.customerPhone!,
      customer_email: repair.customerEmail,
      client_id: repair.customerId,
      repair_status_id: repair.repairStatus?.id!,
      estimated_price: repair.estimatedPrice!,
      final_price: repair.finalPrice,
      advance_payment: repair.advancePayment,
      is_express: repair.isExpress ?? false,
      received_date: this.toIsoString(repair.receivedDate) || nowIso,
      estimated_delivery_date: this.toIsoString(repair.estimatedDeliveryDate, true) || nowIso,
      actual_delivery_date: this.toIsoString(repair.actualDeliveryDate),
      notes: repair.notes,
      created_by: getStoredUserId(),
      repair_items: repair.items?.map(item => ({
        repair_id: item.repairId,
        garment_id: item.garment.id,
        repair_type_id: item.repairType?.id,
        description: item.description,
        price: item.estimatedPrice,
        assigned_to_id: item.assignedToId,
        store_id: item.garment.storeId,
        created_by: getStoredUserId()}))
    };

    return this.repairApiService.create(createRequest);
  }

  update(id: string, repair: Partial<Repair>): Observable<Repair> {
    // Map Repair model to UpdateRepairRequest
    const updateRequest = {
      customer_name: repair.customerName,
      customer_phone: repair.customerPhone,
      customer_email: repair.customerEmail,
      repair_status_id: repair.repairStatus?.id,
      estimated_price: repair.estimatedPrice,
      final_price: repair.finalPrice,
      advance_payment: repair.advancePayment,
      is_express: repair.isExpress,
      received_date: this.toIsoString(repair.receivedDate),
      estimated_delivery_date: this.toIsoString(repair.estimatedDeliveryDate, true),
      actual_delivery_date: this.toIsoString(repair.actualDeliveryDate),
      notes: repair.notes,
      updated_by: getStoredUserId(),
      items: repair.items?.map(item => ({
        repair_item_id: item.id?.startsWith('new-') ? undefined : item.id,
        garment_id: item.garment.id,
        repair_type_id: item.repairType.id,
        description: item.description,
        estimated_price: item.estimatedPrice,
        final_price: item.finalPrice,
        assigned_to_id: item.assignedToId}))
    };
    
    return this.repairApiService.patch(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.repairApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  getPaginated(page: number, pageSize: number): Observable<PaginatedResponse<Repair>> {
    return this.repairApiService.getPaginated(page, pageSize);
  }

  getByStatus(status: string): Observable<Repair[]> {
    return this.repairApiService.getByStatus(status);
  }

  getEstimatedTime(): Observable<number> {
    return this.repairApiService.getEstimatedTime();
  }

  addComment(repairId: string, comment: string, createdBy: string): Observable<RepairComment> {
    return this.repairApiService.addComment(repairId, comment, createdBy);
  }
  
  getComments(repairId: string): Observable<RepairComment[]> {
    return this.repairApiService.getComments(repairId);
  }

  getByAssignedUser(userId: string): Observable<Repair[]> {
    return new Observable(observer => {
      this.repairApiService.getByAssignedUser(userId).subscribe({
        next: (repairs) => {
          observer.next(repairs);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  assignToSeamstress(repairId: string, seamstress: User): Observable<Repair> {
    const assignRequest = {
      repair_id: repairId,
      assigned_to_id: seamstress.id,
      updated_by: getStoredUserId()};
    
    return this.repairApiService.assignToSeamstress(assignRequest);
  }

  getItemsBySeamstress(userId: string): Observable<RepairItem[]> {
    return this.repairApiService.getRepairItemsBySeamstress(userId);
  }

  assignRepairGarments(repairId: string, assignments: Array<{itemId: string, seamstressId?: string}>): Observable<Repair> {
    const assignRequest = {
      repair_id: repairId,
      assignments: assignments.map(a => ({
        repair_item_id: a.itemId,
        assigned_to_id: a.seamstressId,
        attended_by_id: a.seamstressId, 
        updated_by: getStoredUserId()
      })),
      updated_by: getStoredUserId()};

    return this.repairApiService.assignRepairGarments(assignRequest);
  }

  assignRepairItem(itemId: string, seamstressId: string): Observable<RepairItem> {
    const assignRequest = {
      repair_item_id: itemId,
      assigned_to_id: seamstressId,
      updated_by: getStoredUserId()
    };
    return this.repairApiService.assignSingleRepairItem(assignRequest);
  }

  updateItemStatus(itemId: string, status: RepairStatus): Observable<Repair> {
    const updateRequest = {
      repair_item_id: itemId,
      repair_status_id: status.id,
      updated_by: getStoredUserId()
    };

    return this.repairApiService.updateSingleRepairItemStatus(updateRequest);
  }

  updateStatus(repairId: string, status: RepairStatus): Observable<Repair> {
    const updateStatusRequest = {
      repair_id: repairId,
      repair_status_id: status.id,
      updated_by: getStoredUserId()};
    
    return this.repairApiService.updateStatus(updateStatusRequest);
  }

  addItem(repairId: string, item: Partial<RepairItem>): Observable<RepairItem> {
    const req: RepairItemRequest = {
      garment_id: item.garment?.id!,
      repair_type_id: item.repairType!.id,
      description: item.description!,
      estimated_price: item.estimatedPrice!,
      final_price: item.finalPrice,
      assigned_to_id: item.assignedToId,
      sort_order: item.sortOrder};

    return this.repairApiService.addRepairItem(repairId, req);
  }

  updateItem(repairId: string, itemId: string, item: Partial<RepairItem>): Observable<RepairItem> {
    const req: Partial<RepairItemRequest> = {
      garment_id: item.garment?.id,
      repair_type_id: item.repairType?.id,
      description: item.description,
      estimated_price: item.estimatedPrice,
      final_price: item.finalPrice,
      repair_status_id: item.repairStatus?.id,
      assigned_to_id: item.assignedToId,
      sort_order: item.sortOrder};

    return this.repairApiService.updateRepairItem(repairId, itemId, req);
  }

  removeItem(repairId: string, itemId: string): Observable<void> {
    return this.repairApiService.removeRepairItem(repairId, itemId);
  }

  getStats(): Observable<any> {
    return this.repairApiService.getStats();
  }

  private toIsoString(value: unknown, includeTimeIfMissing = false): string | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    if (includeTimeIfMissing && typeof value === 'string') {
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split('-').map(Number);
        const now = new Date();
        const withTime = new Date(
          year,
          month - 1,
          day,
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );

        return Number.isNaN(withTime.getTime()) ? undefined : withTime.toISOString();
      }
    }

    const date = value instanceof Date ? value : new Date(value as string);
    
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

}
