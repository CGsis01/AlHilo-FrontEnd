import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { UserUseCases } from '../../../domain/usecases/user.usecases';
import { RoleUseCases } from '../../../domain/usecases/role.usecases';
import { User, UserRole } from '../../../core/models/user.model';
import { Store } from '../../../core/models/store.model';

type EditableUser = Partial<Omit<User, 'role'>> & { role: UserRole; store: Partial<Store>; password?: string };

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
  stores: Store[] = [];
  isLoading = true;
  isEditing = false;
  editingUser: EditableUser = this.createEmptyUser();
  selectedRole: UserRole | null = null;
  selectedStore: Store | null = null;
  selectedStoreFilter: string = '';
  showModal = false;
  errorMessage = '';

  constructor(private userUseCases: UserUseCases, private roleUseCases: RoleUseCases, private storeUseCases: StoreUseCases) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.loadStores();
    this.loadUsers();
    this.loadRoles();

    this.isLoading = false;
  }

  loadStores(): void {
    this.storeUseCases.getActiveStores().subscribe({
      next: (stores) => { this.stores = stores; },
      error: (error) => { console.error('Error loading stores:', error); }});
  }

  loadUsers(): void {
    const loadMethod = this.selectedStoreFilter 
      ? this.userUseCases.getUsersByStore(this.selectedStoreFilter)
      : this.userUseCases.getAllUsers();

    loadMethod.subscribe({
      next: (users) => { this.users = users; },
      error: (error) => { console.error('Error loading users:', error); }});
  }

  loadRoles(): void {
      this.roleUseCases.getAllRoles().subscribe({
      next: (roles) => { this.roles = roles; },
      error: (error) => { console.error('Error loading roles:', error); }});
  }

  getRoleClass(role: string): string {
    const roleMap: Record<string, string> = {
      'Administrator': 'role-admin',
      'Receptionist': 'role-receptionist',
      'HeadSewing': 'role-headsewing',
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
    this.editingUser = { ...user, role: { ...user.role }, store: user.store ? { ...user.store } : { id: '', name: '' } as Store };
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
    if (!this.editingUser.name || !this.editingUser.email || !this.editingUser.role.code || (!this.editingUser.store.id && this.stores.length > 0)) {
      this.errorMessage = 'Nombre, email, rol y sucursal son requeridos';

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
      ? this.userUseCases.deactivateUser(user.id, user.store ? user.store.id : undefined) 
      : this.userUseCases.activateUser(user.id, user.store ? user.store.id : undefined);

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

  onStoreChange(storeIdOrEvent: string | Event): void {
    const storeId = typeof storeIdOrEvent === 'string'
      ? storeIdOrEvent
      : ((storeIdOrEvent.target as HTMLSelectElement | null)?.value ?? '');
    
      this.selectedStore = this.stores.find(store => store.id === storeId) || null;
    
      this.editingUser.store = this.selectedStore
      ? { id: this.selectedStore.id, name: this.selectedStore.name } as Store
      : { id: '', name: '' } as Store;
  }

  onStoreFilterChange(): void {
    this.isLoading = true;
    
    this.loadUsers();

    this.isLoading = false;
  }

  private createEmptyUser(): EditableUser {
    return {
      name: '',
      email: '',
      password: '',
      role: { id: '', name: '', code: '' },
      store: { id: '', name: '' } as Store,
      isActive: true};
  }
}
