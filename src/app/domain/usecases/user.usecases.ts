import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepository } from '../../data/repositories/user.repository';
import { User, UserRole } from '../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class UserUseCases {
  constructor(private userRepository: UserRepository) {}

  getAllUsers(): Observable<User[]> {
    return this.userRepository.getAll();
  }

  getUserById(id: string): Observable<User> {
    return this.userRepository.getById(id);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.userRepository.create(user);
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.userRepository.update(id, user);
  }

  deleteUser(id: string): Observable<boolean> {
    return this.userRepository.delete(id);
  }

  getUsersByRole(roles: UserRole[]): Observable<User[]> {
    return this.userRepository.getByRole(roles);
  }

  getUsersByStore(storeId: string): Observable<User[]> {
    return this.userRepository.getByStore(storeId);
  }

  changePassword(userId: string, oldPassword: string, newPassword: string): Observable<boolean> {
    return this.userRepository.updatePassword(userId, oldPassword, newPassword);
  }

  activateUser(id: string, storeId?: string): Observable<boolean> {
    return this.userRepository.activate(id, storeId);
  }

  deactivateUser(id: string, storeId?: string): Observable<boolean> {
    return this.userRepository.deactivate(id, storeId);
  }
}
