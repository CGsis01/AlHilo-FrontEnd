import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Repair } from '../../core/models/repair.model';
import { RepairItem } from '../../core/models/repair-item.model';
import { PaginatedResponse } from '../../core/interfaces/api-response.interface';
import { User } from '@core/models/user.model';

export interface RepairItemRequest {
  repair_item_id?: string;
  repair_id?: string;
  garment_id: string;
  repair_type_id: string;
  description: string;
  estimated_price: number;
  final_price?: number;
  sort_order?: number;
}

export interface CreateRepairRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  client_id?: string;
  repair_status_id: string;
  estimated_price: number;
  final_price?: number;
  items?: RepairItemRequest[];
  assigned_to_id?: string;
  received_date: string;
  estimated_delivery_date: string;
  actual_delivery_date?: string;
  notes?: string;
  created_by: string;
}

export interface UpdateRepairRequest {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  client_id?: string;
  repair_status_id?: string;
  estimated_price?: number;
  final_price?: number;
  items?: RepairItemRequest[];
  assigned_to_id?: string;
  received_date?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  updated_by: string;
}

export interface AssignRepairRequest {
  repair_id: string;
  assigned_to_id: string;
}
  
export interface UpdateStatusRequest {
  repair_id: string;
  repair_status_id: string;
  updated_by: string;
}

export interface RepairFilters {
  repair_status_id?: string;
  repair_type_id?: string;
  assigned_to_id?: string;
  created_by_id?: string;
  client_id?: string;
  customer_phone?: string;
  search?: string;  // Search by customer name, phone, or garment type
  date_from?: string;  // ISO date string
  date_to?: string;  // ISO date string
}

export interface RepairStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  delivered: number;
  cancelled: number;
}

@Injectable({
  providedIn: 'root'
})

export class RepairApiService {
  private readonly endpoint = '/repairs';

  constructor(private apiService: ApiService) {}

  getAll(filters?: RepairFilters): Observable<Repair[]> {
    let params = this.buildFilterParams(filters);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.apiService.get<Repair[]>(this.endpoint, params)
    .pipe(map(response => response.map(r => this.mapRepair(r))));
  }

  getPaginated(page: number = 1, pageSize: number = 10, filters?: RepairFilters): Observable<PaginatedResponse<Repair>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    params = this.mergeParams(params, this.buildFilterParams(filters));

    return this.apiService.get<PaginatedResponse<Repair>>(this.endpoint, params)
    .pipe(map(response => {
      response.items = response.items.map(r => this.mapRepair(r));
      return response;}));
  }

  getById(id: string): Observable<Repair> {
    return this.apiService.get<Repair>(`${this.endpoint}/${id}`)
    .pipe(map(r => this.mapRepair(r)));
  }

  getByStatus(status: string): Observable<Repair[]> {
    return this.getAll({ repair_status_id: status });
  }

  getByAssignedUser(userId: string): Observable<Repair[]> {
    return this.getAll({ assigned_to_id: userId });
  }

  getByCreatedUser(userId: string): Observable<Repair[]> {
    return this.getAll({ created_by_id: userId });
  }

  getByClient(clientId: string): Observable<Repair[]> {
    return this.getAll({ client_id: clientId });
  }

  create(repairData: CreateRepairRequest): Observable<Repair> {
    return this.apiService.post<Repair>(this.endpoint, repairData)
    .pipe(map(r => this.mapRepair(r)));
  }

  update(id: string, repairData: UpdateRepairRequest): Observable<Repair> {
    return this.apiService.put<Repair>(`${this.endpoint}/${id}`, repairData)
    .pipe(map(r => this.mapRepair(r)));
  }

  patch(id: string, repairData: Partial<UpdateRepairRequest>): Observable<Repair> {
    return this.apiService.patch<Repair>(`${this.endpoint}/${id}`, repairData)
    .pipe(map(r => this.mapRepair(r)));
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`);
  }

  updateStatus(update_status_params: UpdateStatusRequest): Observable<Repair> {
    return this.apiService.post<Repair>(`${this.endpoint}/update-status`, update_status_params)
    .pipe(map(r => this.mapRepair(r)));
  }

  assignToSeamstress(assign_params: AssignRepairRequest): Observable<Repair> {
    return this.apiService.post<Repair>(`${this.endpoint}/assign`, assign_params)
    .pipe(map(r => this.mapRepair(r)));
  }

  markAsDelivered(id: string, finalPrice?: number): Observable<Repair> {
    const data: any = { repair_status_id: '4' };
    
    if (finalPrice !== undefined) data.final_price = finalPrice;
    
    data.actual_delivery_date = new Date().toISOString();
    
    return this.patch(id, data);
  }

  getStats(filters?: RepairFilters): Observable<RepairStats> {
    let params = this.buildFilterParams(filters);
    return this.apiService.get<RepairStats>(`${this.endpoint}/stats`, params);
  }

  getHistory(id: string): Observable<any[]> {
    return this.apiService.get<any[]>(`${this.endpoint}/${id}/history`);
  }

  searchByCustomerPhone(phone: string): Observable<Repair[]> {
    return this.getAll({ customer_phone: phone });
  }

  getOverdue(): Observable<Repair[]> {
    return this.apiService.get<Repair[]>(`${this.endpoint}/overdue`);
  }

  getDueToday(): Observable<Repair[]> {
    return this.apiService.get<Repair[]>(`${this.endpoint}/due-today`);
  }

  getByDateRange(dateFrom: string, dateTo: string): Observable<Repair[]> {
    return this.getAll({ date_from: dateFrom, date_to: dateTo });
  }

  getReportData(dateFrom: string, dateTo: string): Observable<any> {
    const params = new HttpParams()
      .set('date_from', dateFrom)
      .set('date_to', dateTo);
    return this.apiService.get<any>(`${this.endpoint}/reports`, params);
  }

  addRepairItem(repairId: string, item: RepairItemRequest): Observable<RepairItem> {
    return this.apiService.post<any>(`${this.endpoint}/${repairId}/items`, item)
      .pipe(map(i => this.mapRepairItem(repairId, i)));
  }

  updateRepairItem(repairId: string, itemId: string, item: Partial<RepairItemRequest>): Observable<RepairItem> {
    return this.apiService.put<any>(`${this.endpoint}/${repairId}/items/${itemId}`, item)
      .pipe(map(i => this.mapRepairItem(repairId, i)));
  }

  removeRepairItem(repairId: string, itemId: string): Observable<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${repairId}/items/${itemId}`);
  }

  private buildFilterParams(filters?: RepairFilters): HttpParams {
    let params = new HttpParams();

    if (filters) {
      if (filters.repair_status_id) params = params.set('repair_status_id', filters.repair_status_id);
      if (filters.repair_type_id) params = params.set('repair_type_id', filters.repair_type_id);
      if (filters.assigned_to_id) params = params.set('assigned_to_id', filters.assigned_to_id);
      if (filters.created_by_id) params = params.set('created_by_id', filters.created_by_id);
      if (filters.client_id) params = params.set('client_id', filters.client_id);
      if (filters.customer_phone) params = params.set('customer_phone', filters.customer_phone);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);}

    return params;
  }

  private mergeParams(params1: HttpParams, params2: HttpParams): HttpParams {
    let result = params1;
    
    params2.keys().forEach(key => {
      const value = params2.get(key);
      if (value) result = result.set(key, value);});
    
    return result;
  }

  private mapRepair(repair: any): Repair {
    const items: RepairItem[] | undefined = Array.isArray(repair.repair_items) && repair.repair_items.length > 0
      ? repair.repair_items.map((item: any): RepairItem => ({
          id: item.id,
          repairId: repair.id,
          garment: {
            id: item.garment.id,
            name: item.garment.name,
            code: item.garment.code,
            description: item.garment.description,
            category: item.garment.category,
            storeId: item.garment.store_id,
            repairTypes: [], // This will be populated separately if needed
            isActive: item.garment.is_active,
            createdAt: item.garment.created_at,
            updatedAt: item.garment.updated_at
          },
          repairType: {
            id: item.repair_type.id,
            name: item.repair_type.name,
            code: item.repair_type.code,
            estimatedPrice: item.repair_type.estimated_price,
            estimatedTime: item.repair_type.estimated_time,
            commissionPercentage: item.repair_type.commission_percentage,
            repairComplexity: {
              id: item.repair_type.repair_complexity.id,
              name: item.repair_type.repair_complexity.name,
              code: item.repair_type.repair_complexity.code,
              laborMultiplier: item.repair_type.repair_complexity.labor_multiplier,
              timeMultiplier: item.repair_type.repair_complexity.time_multiplier,
              storeId: item.repair_type.repair_complexity.store_id,
              isActive: item.repair_type.repair_complexity.is_active,
              createdAt: item.repair_type.repair_complexity.created_at,
              updatedAt: item.repair_type.repair_complexity.updated_at
            },
            store: {
              id: item.repair_type.store.id,
              name: item.repair_type.store.name,
              isActive: item.repair_type.store.is_active,
              createdAt: item.repair_type.store.created_at,
              updatedAt: item.repair_type.store.updated_at
            },
            isActive: item.repair_type.is_active,
            createdAt: item.repair_type.created_at
          },
          description: item.description,
          estimatedPrice: item.price,
          finalPrice: item.final_price,
          sortOrder: item.sort_order,
          createdAt: item.created_at ? new Date(item.created_at) : undefined,
          updatedAt: item.updated_at ? new Date(item.updated_at) : undefined
        }))
      : undefined;

    return {
      id: repair.id,
      customerName: repair.customer_name,
      customerPhone: repair.customer_phone,
      customerEmail: repair.customer_email,
      customerId: repair.client_id,
      repairStatus: {
        id: repair.repair_status.repair_status_id,
        name: repair.repair_status.name
      },
      estimatedPrice: items
        ? items.reduce((sum, i) => sum + (Number(i.estimatedPrice) || 0), 0)
        : (Number(repair.estimated_price) || 0),
      advancePayment: repair.advance_payment,
      isExpress: repair.is_express ?? false,
      finalPrice: items
        ? items.reduce((sum, i) => sum + (Number(i.finalPrice ?? i.estimatedPrice) || 0), 0)
        : (repair.final_price !== undefined && repair.final_price !== null
          ? (Number(repair.final_price) || 0)
          : undefined),
      assignedTo: repair.assigned_to ? <User>{
        id: repair.assigned_to.user_id,
        name: repair.assigned_to.name
      } : undefined,
      createdBy: <User>{
        id: repair.created_by_user.id,
        name: repair.created_by_user.name,
        email: repair.created_by_user.email,
        role: repair.created_by_user.role
      },
      receivedDate: new Date(repair.received_date),
      estimatedDeliveryDate: new Date(repair.estimated_delivery_date),
      actualDeliveryDate: repair.actual_delivery_date ? new Date(repair.actual_delivery_date) : undefined,
      notes: repair.notes,
      items,
      createdAt: new Date(repair.created_at),
      updatedAt: new Date(repair.updated_at)
    };
  }

  private mapRepairItem(repairId: string, item: any): RepairItem {
    return {
      id: item.repair_item_id,
      repairId,
      garment: {
        id: item.garment.id,
        name: item.garment.name,
        code: item.garment.code,
        description: item.garment.description,
        category: item.garment.category,
        storeId: item.garment.store_id,
        repairTypes: [], // This will be populated separately if needed
        isActive: item.garment.is_active,
        createdAt: item.garment.created_at,
        updatedAt: item.garment.updated_at
      },
      repairType: {
        id: item.repair_type.repair_type_id,
        name: item.repair_type.name,
        code: item.repair_type.code,
        estimatedPrice: item.repair_type.estimated_price,
        estimatedTime: item.repair_type.estimated_time,
        commissionPercentage: item.repair_type.commission_percentage,
        repairComplexity: {
          id: item.repair_type.repair_complexity.id,
          name: item.repair_type.repair_complexity.name,
          code: item.repair_type.repair_complexity.code,
          laborMultiplier: item.repair_type.repair_complexity.labor_multiplier,
          timeMultiplier: item.repair_type.repair_complexity.time_multiplier,
          storeId: item.repair_type.repair_complexity.store_id,
          isActive: item.repair_type.repair_complexity.is_active,
          createdAt: item.repair_type.repair_complexity.created_at,
          updatedAt: item.repair_type.repair_complexity.updated_at
        },
        store: {
          id: item.repair_type.store.id,
          name: item.repair_type.store.name,
          isActive: item.repair_type.store.is_active,
          createdAt: item.repair_type.store.created_at,
          updatedAt: item.repair_type.store.updated_at
        },
        isActive: item.repair_type.is_active,
        createdAt: item.repair_type.created_at
      },
      description: item.description,
      estimatedPrice: item.estimated_price,
      finalPrice: item.final_price,
      sortOrder: item.sort_order,
      createdAt: item.created_at ? new Date(item.created_at) : undefined,
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined};
  }
}
