import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairTypeRelationRepository } from '../../data/repositories/repair-type-relation.repository';
import { RepairTypeMaterial } from '../../core/models/repair-type-material.model';

@Injectable({
  providedIn: 'root'
})

export class RepairTypeRelationUseCases {
  constructor(private repository: RepairTypeRelationRepository) {}

  getMaterials(repairTypeId: string): Observable<RepairTypeMaterial[]> {
    return this.repository.getMaterials(repairTypeId);
  }

  addMaterial(materialRelation: RepairTypeMaterial): Observable<RepairTypeMaterial> {
    return this.repository.addMaterial(materialRelation);
  }

  updateMaterial(materialRelation: RepairTypeMaterial): Observable<RepairTypeMaterial> {
    return this.repository.updateMaterial(materialRelation);
  }

  removeMaterial(materialRelation: RepairTypeMaterial): Observable<void> {
    return this.repository.removeMaterial(materialRelation);
  }
}
