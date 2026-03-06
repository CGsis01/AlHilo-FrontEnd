import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from '../../core/models/role.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { RoleApiService } from '../../core/services/role-api.service';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class RoleRepository implements Repository<Role> {
  constructor(private roleApiService: RoleApiService) {}

  getAll(): Observable<Role[]> {
    return this.roleApiService.getAll();
  }

  getById(id: string): Observable<Role> {
    return this.roleApiService.getById(id);
  }

  create(role: Partial<Role>): Observable<Role> {
    const createRequest = {
      name: role.name!,
      code: role.code!,
      created_by: this.getStoredUserId()};
    
    return this.roleApiService.create(createRequest);
  }

  update(id: string, role: Partial<Role>): Observable<Role> {
    const updateRequest = {
      name: role.name,
      code: role.code,
      updated_by: this.getStoredUserId()};
    
    return this.roleApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.roleApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  getActiveRoles(): Observable<Role[]> {
    return this.roleApiService.getActiveRoles();
  }

  activate(id: string): Observable<boolean> {
    const activateRequest = {
      id: id,
      updated_by: this.getStoredUserId()}

    return this.roleApiService.activate(activateRequest);
  }

  deactivate(id: string): Observable<boolean> {
    const deactivateRequest = {
      id: id,
      updated_by: this.getStoredUserId()}

    return this.roleApiService.deactivate(deactivateRequest);
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }
}
