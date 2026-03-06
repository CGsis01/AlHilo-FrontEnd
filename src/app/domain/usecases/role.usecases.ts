import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '../../data/repositories/role.repository';
import { Role } from '../../core/models/role.model';

@Injectable({
  providedIn: 'root'
})

export class RoleUseCases {
  constructor(private roleRepository: RoleRepository) {}

  getAllRoles(): Observable<Role[]> {
    return this.roleRepository.getAll();
  }

  getRoleById(id: string): Observable<Role> {
    return this.roleRepository.getById(id);
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.roleRepository.create(role);
  }

  updateRole(id: string, role: Partial<Role>): Observable<Role> {
    return this.roleRepository.update(id, role);
  }

  deleteRole(id: string): Observable<boolean> {
    return this.roleRepository.delete(id);
  }

  getActiveRoles(): Observable<Role[]> {
    return this.roleRepository.getActiveRoles();
  }

  activateRole(id: string): Observable<boolean> {
    return this.roleRepository.activate(id);
  }

  deactivateRole(id: string): Observable<boolean> {
    return this.roleRepository.deactivate(id);
  }
}
