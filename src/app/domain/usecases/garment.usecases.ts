import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GarmentRepository } from '../../data/repositories/garment.repository';
import { Garment, GarmentRepairType } from '../../core/models/garment.model';

@Injectable({
  providedIn: 'root'
})

export class GarmentUseCases {
  constructor(private garmentRepository: GarmentRepository) {}

  getAllGarments(): Observable<Garment[]> {
    return this.garmentRepository.getAll();
  }

  getGarmentById(id: string): Observable<Garment> {
    return this.garmentRepository.getById(id);
  }

  getGarmentsByStore(storeId: string): Observable<Garment[]> {
    return this.garmentRepository.getGarmentsByStore(storeId);
  }

  getActiveGarments(storeId?: string): Observable<Garment[]> {
    return this.garmentRepository.getActiveGarments(storeId);
  }

  createGarment(garment: Partial<Garment>): Observable<Garment> {
    return this.garmentRepository.create(garment);
  }

  updateGarment(id: string, garment: Partial<Garment>): Observable<Garment> {
    return this.garmentRepository.update(id, garment);
  }

  deleteGarment(id: string): Observable<boolean> {
    return this.garmentRepository.delete(id);
  }

  activateGarment(id: string): Observable<boolean> {
    return this.garmentRepository.activate(id);
  }

  deactivateGarment(id: string): Observable<boolean> {
    return this.garmentRepository.deactivate(id);
  }

  addRepairTypeToGarment(
    garmentId: string,
    repairTypeId: string,
    storeId: string,
    options?: {
      isDefault?: boolean;
      estimatedPriceOverride?: number;
      estimatedTimeOverride?: number;
      sortOrder?: number;
    }
  ): Observable<GarmentRepairType> {
    return this.garmentRepository.addRepairType(garmentId, repairTypeId, storeId, options);
  }

  getGarmentRepairTypes(garmentId: string, storeId: string): Observable<GarmentRepairType[]> {
    return this.garmentRepository.getGarmentRepairTypes(garmentId, storeId);
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
    return this.garmentRepository.updateGarmentRepairType(garmentId, repairTypeId, storeId, options);
  }
}
