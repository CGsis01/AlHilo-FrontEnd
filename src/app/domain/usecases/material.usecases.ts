import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MaterialRepository } from '../../data/repositories/material.repository';
import { Material } from '../../core/models/material.model';

@Injectable({
  providedIn: 'root'
})

export class MaterialUseCases {
  constructor(private materialRepository: MaterialRepository) {}

  getAllMaterials(): Observable<Material[]> {
    return this.materialRepository.getAll();
  }

  getMaterialById(id: string): Observable<Material> {
    return this.materialRepository.getById(id);
  }

  createMaterial(material: Partial<Material>): Observable<Material> {
    return this.materialRepository.create(material);
  }

  updateMaterial(id: string, material: Partial<Material>): Observable<Material> {
    return this.materialRepository.update(id, material);
  }

  deleteMaterial(id: string): Observable<boolean> {
    return this.materialRepository.delete(id);
  }

  getActiveMaterials(storeId?: string): Observable<Material[]> {
    return this.materialRepository.getActiveMaterials(storeId);
  }

  getMaterialsByStore(storeId: string): Observable<Material[]> {
    return this.materialRepository.getByStore(storeId);
  }

  activateMaterial(id: string, storeId: string): Observable<boolean> {
    return this.materialRepository.activate(id, storeId);
  }

  deactivateMaterial(id: string, storeId: string): Observable<boolean> {
    return this.materialRepository.deactivate(id, storeId);
  }
}
