import { Component, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { UserUseCases } from '../../../domain/usecases/user.usecases';
import { RoleUseCases } from '../../../domain/usecases/role.usecases';
import { User, UserRole } from '../../../core/models/user.model';
import { Store } from '../../../core/models/store.model';
import { Role } from '@core/models/role.model';

type EditableUser = Partial<Omit<User, 'role'>> & { role: UserRole; store: Partial<Store>; password?: string };

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})

export class UsersComponent implements OnInit {
  isLoading = signal(true);
  isEditing = signal(false);
  showModal = signal(false);

  users: User[] = [];
  
  editingUser: EditableUser = this.createEmptyUser();
  selectedRole: UserRole | null = null;
  selectedStore: Store | null = null;
  selectedStoreFilter: string = '';
  errorMessage = '';

  roles = toSignal(this.roleUseCases.getAllRoles().pipe(
    catchError(error => {
      console.error('Error loading roles:', error);
      return of([] as UserRole[]);})
    ),
    { initialValue: [] as UserRole[] }
  );

  stores = toSignal(this.storeUseCases.getActiveStores().pipe(
    catchError(error => {
      console.error('Error loading stores:', error);
      return of([] as Store[]);})
    ),
    { initialValue: [] as Store[] }
  );

  // Modal to Add/Edit Users state
  modalTitle = computed(() => this.isEditing() ? 'Editar Usuario' : 'Agregar Usuario');
  saveButtonLabel = computed(() => this.isEditing() ? 'Actualizar' : 'Crear');

  constructor(private userUseCases: UserUseCases, private roleUseCases: RoleUseCases, private storeUseCases: StoreUseCases) {}

  ngOnInit(): void {
    this.isLoading.set(true);

    this.loadUsers();
    
    this.isLoading.set(false);
  }

  loadUsers(): void {
    const loadMethod = this.selectedStoreFilter 
      ? this.userUseCases.getUsersByStore(this.selectedStoreFilter)
      : this.userUseCases.getAllUsers();

    loadMethod.subscribe({
      next: (users) => { this.users = users; },
      error: (error) => { console.error('Error loading users:', error); }});
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
    this.isEditing.set(false);
    
    this.editingUser = this.createEmptyUser();
    this.selectedRole = null;
    
    this.showModal.set(true);
    this.errorMessage = '';
  }

  openEditModal(user: User): void {
    this.isEditing.set(true);
    
    this.editingUser = { ...user, role: { ...user.role }, store: user.store ? { ...user.store } : { id: '', name: '' } as Store };
    this.selectedRole = user.role;
    
    this.showModal.set(true);
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal.set(false);
    
    this.editingUser = this.createEmptyUser();
    this.selectedRole = null;
    this.errorMessage = '';
  }

  saveUser(): void {
    if (!this.editingUser.name || !this.editingUser.email || !this.editingUser.role.code || (!this.editingUser.store.id && this.stores.length > 0)) {
      this.errorMessage = 'Nombre, email, rol y sucursal son requeridos';

      return;
    }

    if (this.isEditing() && this.editingUser.id) {
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

    this.selectedRole = this.roles().find(role => role.id === roleId) || null;
    
    this.editingUser.role = this.selectedRole
      ? { id: this.selectedRole.id, name: this.selectedRole.name, code: this.selectedRole.code }
      : { id: '', name: '', code: '' };
  }

  onStoreChange(storeIdOrEvent: string | Event): void {
    const storeId = typeof storeIdOrEvent === 'string'
      ? storeIdOrEvent
      : ((storeIdOrEvent.target as HTMLSelectElement | null)?.value ?? '');
    
      this.selectedStore = this.stores().find(store => store.id === storeId) || null;
    
      this.editingUser.store = this.selectedStore
      ? { id: this.selectedStore.id, name: this.selectedStore.name } as Store
      : { id: '', name: '' } as Store;
  }

  onStoreFilterChange(): void {
    this.isLoading.set(true);
    
    this.loadUsers();

    this.isLoading.set(false);
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
