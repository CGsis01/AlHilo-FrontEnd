import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRole, UserRoleCode } from '../../core/models/user.model';
import { Repository } from '../../core/interfaces/repository.interface';
import { UserApiService } from '../../core/services/user-api.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class UserRepository implements Repository<User> {
  constructor(
    private userApiService: UserApiService
  ) {}

  getAll(): Observable<User[]> {
    return this.userApiService.getAll();
  }

  getById(id: string): Observable<User> {
    return this.userApiService.getById(id);
  }

  create(user: Partial<User>): Observable<User> {
    // Map User model to CreateUserRequest
    const createRequest = {
      name: user.name!,
      email: user.email!,
      password: user.password!, // Should be provided by the form
      role_id: user.role!.id!,
      store_id: user.store ? user.store.id : undefined,
      created_by: this.getStoredUserId()};
    
    return this.userApiService.create(createRequest);
  }

  update(id: string, user: Partial<User>): Observable<User> {
    // Map User model to UpdateUserRequest
    const updateRequest = {
      name: user.name,
      email: user.email,
      role_id: user.role!.id,
      store_id: user.store ? user.store.id : undefined,
      is_active: user.isActive,
      updated_by: this.getStoredUserId()};
    
    return this.userApiService.update(id, updateRequest);
  }

  delete(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.userApiService.delete(id).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();},
        error: (error) => {
          observer.error(error);}});});
  }

  getByRole(roles: UserRole[]): Observable<User[]> {
    return this.userApiService.getByRole(roles);
  }

  getByStore(storeId: string): Observable<User[]> {    
    return this.userApiService.getByStore(storeId);
  }

  updatePassword(userId: string, oldPassword: string, newPassword: string): Observable<boolean> {
    // Password update should be done through auth service
    return new Observable(observer => {
      observer.next(true);
      observer.complete();});
  }

  getActiveSeamstresses(): Observable<User[]> {
    return this.userApiService.getActiveSeamstresses();
  }

  activate(id: string, storeId?: string): Observable<boolean> {
    const activateRequest = {
      id: id,
      store_id: storeId,
      updated_by: this.getStoredUserId()}

    return this.userApiService.activate(activateRequest);
  }

  deactivate(id: string, storeId?: string): Observable<boolean> {
    const deactivateRequest = {
      id: id,
      store_id: storeId,
      updated_by: this.getStoredUserId()}

    return this.userApiService.deactivate(deactivateRequest);
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return (JSON.parse(userJson) as User).id;
  }
}
