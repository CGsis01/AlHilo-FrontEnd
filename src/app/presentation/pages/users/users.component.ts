import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserUseCases } from '../../../domain/usecases/user.usecases';
import { RoleUseCases } from '../../../domain/usecases/role.usecases';
import { User, UserRole } from '../../../core/models/user.model';

type EditableUser = Partial<Omit<User, 'role'>> & { role: UserRole; password?: string };

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})

export class UsersComponent implements OnInit {
  users: User[] = [];
  roles: UserRole[] = [];
  isLoading = true;
  isEditing = false;
  editingUser: EditableUser = this.createEmptyUser();
  selectedRole: UserRole | null = null;
  showModal = false;
  errorMessage = '';

  constructor(private userUseCases: UserUseCases, private roleUseCases: RoleUseCases) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userUseCases.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;},
      error: () => {
        this.isLoading = false;}});
  }

  loadRoles(): void {
      this.roleUseCases.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;},
      error: (error) => {
        console.error('Error loading roles:', error);
        this.isLoading = false;}});
  }

  getRoleClass(role: string): string {
    const roleMap: Record<string, string> = {
      'Administrator': 'role-admin',
      'Receptionist': 'role-receptionist',
      'Seamstress': 'role-seamstress'};

    return roleMap[role] || '';
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingUser = this.createEmptyUser();
    this.selectedRole = null;
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(user: User): void {
    this.isEditing = true;
    this.editingUser = { ...user, role: { ...user.role } };
    this.selectedRole = user.role;
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = this.createEmptyUser();
    this.selectedRole = null;
    this.errorMessage = '';
  }

  saveUser(): void {
    if (!this.editingUser.name || !this.editingUser.email || !this.editingUser.role.code) {
      this.errorMessage = 'Nombre, email y rol son requeridos';

      return;
    }

    if (this.isEditing && this.editingUser.id) {
      this.userUseCases.updateUser(this.editingUser.id, this.editingUser).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();},
        error: (error) => {
          console.error('Error updating user:', error);
          this.errorMessage = 'Error al actualizar el usuario';}});
    } else {
      this.userUseCases.createUser(this.editingUser).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();},
        error: (error) => {
          console.error('Error creating user:', error);
          this.errorMessage = 'Error al crear el usuario';}});
    }
  }

  toggleStatus(user: User): void {
    const action = user.isActive 
      ? this.userUseCases.deactivateUser(user.id) 
      : this.userUseCases.activateUser(user.id);

    action.subscribe({
      next: () => {
        this.loadUsers();},
      error: (error) => {
        console.error('Error toggling user status:', error);}});
  }

  onRoleChange(roleIdOrEvent: string | Event): void {
    const roleId = typeof roleIdOrEvent === 'string'
      ? roleIdOrEvent
      : ((roleIdOrEvent.target as HTMLSelectElement | null)?.value ?? '');

    this.selectedRole = this.roles.find(role => role.id === roleId) || null;
    this.editingUser.role = this.selectedRole
      ? { id: this.selectedRole.id, name: this.selectedRole.name, code: this.selectedRole.code }
      : { id: '', name: '', code: '' };
  }

  private createEmptyUser(): EditableUser {
    return {
      name: '',
      email: '',
      password: '',
      role: { id: '', name: '', code: '' },
      isActive: true};
  }
}
