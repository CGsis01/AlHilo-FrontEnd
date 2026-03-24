import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Garment, GarmentRepairType } from '../../core/models/garment.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { GarmentApiService } from '../../core/services/garment-api.service';
import { User } from '@core/models/user.model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})

export class GarmentRepository implements Repository<Garment> {
  constructor(private garmentApiService: GarmentApiService) {}

  getAll(): Observable<Garment[]> {
    return this.garmentApiService.getAll();
  }

  getById(id: string): Observable<Garment> {
    return this.garmentApiService.getById(id);
  }

  create(garment: Partial<Garment>): Observable<Garment> {
    const createRequest = {
      name: garment.name!,
      code: garment.code!,
      description: garment.description,
      category: garment.category,
      store_id: garment.storeId!,
      created_by: this.getStoredUserId()
    };
    
    return this.garmentApiService.create(createRequest);
  }

  update(id: string, garment: Partial<Garment>): Observable<Garment> {
    const updateRequest = {
      name: garment.name,
      code: garment.code,
      description: garment.description,
      category: garment.category,
      store_id: garment.storeId,
      updated_by: this.getStoredUserId()
    };
    
    return this.garmentApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return this.garmentApiService.deactivate({
      id,
      updated_by: this.getStoredUserId()
    });
  }

  activate(id: string): Observable<boolean> {
    return this.garmentApiService.activate({
      id,
      updated_by: this.getStoredUserId()
    });
  }

  deactivate(id: string): Observable<boolean> {
    return this.garmentApiService.deactivate({
      id,
      updated_by: this.getStoredUserId()
    });
  }

  getGarmentsByStore(storeId: string): Observable<Garment[]> {
    return this.garmentApiService.getByStore(storeId);
  }

  getActiveGarments(storeId?: string): Observable<Garment[]> {
    return this.garmentApiService.getActiveGarments(storeId);
  }

  addRepairType(garmentId: string, repairTypeId: string, storeId: string, options?: {
    isDefault?: boolean;
    estimatedPriceOverride?: number;
    estimatedTimeOverride?: number;
    sortOrder?: number;
  }): Observable<GarmentRepairType> {
    return this.garmentApiService.addRepairType(garmentId, {
      garment_id: garmentId,
      repair_type_id: repairTypeId,
      store_id: storeId,
      is_default: options?.isDefault,
      estimated_price_override: options?.estimatedPriceOverride,
      estimated_time_override: options?.estimatedTimeOverride,
      sort_order: options?.sortOrder,
      created_by: this.getStoredUserId()
    });
  }

  getGarmentRepairTypes(garmentId: string, storeId: string): Observable<GarmentRepairType[]> {
    return this.garmentApiService.getGarmentRepairTypes(garmentId, storeId);
  }

  updateGarmentRepairType(
    garmentId: string,
    repairTypeId: string,
    storeId: string,
    options: {
      isDefault?: boolean;
      estimatedPriceOverride?: number;
      estimatedTimeOverride?: number;
      sortOrder?: number;
    }
  ): Observable<GarmentRepairType> {
    return this.garmentApiService.updateGarmentRepairType(garmentId, repairTypeId, storeId, {
      is_default: options.isDefault,
      estimated_price_override: options.estimatedPriceOverride,
      estimated_time_override: options.estimatedTimeOverride,
      sort_order: options.sortOrder,
      updated_by: this.getStoredUserId()
    });
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);
    
    if (!userJson) {
        throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }
}
