import { Component, OnDestroy, OnInit, Injector, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { UserUseCases } from '../../../domain/usecases/user.usecases';
import { RoleUseCases } from '../../../domain/usecases/role.usecases';
import { User, UserRole } from '../../../core/models/user.model';
import { Store } from '../../../core/models/store.model';
import { FingerprintService } from '../../../core/services/fingerprint-reader.service';
// import { FingerprintService } from '../../../core/services/fingerprint-reader.service';

type EditableUser =
  Partial<Omit<User, 'role'>> & {
    role: UserRole;
    store: Partial<Store>;
    password?: string;
    fingerprintSamples?: string[];
  };

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})

export class UsersComponent implements OnInit, OnDestroy {
  isLoading = signal(true);
  isEditing = signal(false);
  showModal = signal(false);

  users: User[] = [];

  editingUser: EditableUser = this.createEmptyUser();
  selectedRole: UserRole | null = null;
  selectedStore: Store | null = null;
  selectedStoreFilter: string = '';
  errorMessage = '';

  roles = toSignal(
    this.roleUseCases.getAllRoles().pipe(
      catchError((error) => {
        console.error('Error loading roles:', error);

        return of([] as UserRole[]);
      })
    ),
    { initialValue: [] as UserRole[] }
  );

  stores = toSignal(
    this.storeUseCases.getActiveStores().pipe(
      catchError((error) => {
        console.error('Error loading stores:', error);

        return of([] as Store[]);
      })
    ),
    { initialValue: [] as Store[] }
  );

  modalTitle = computed(() => this.isEditing() ? 'Editar Usuario' : 'Agregar Usuario');
  saveButtonLabel = computed(() => this.isEditing() ? 'Actualizar' : 'Crear');

  private fingerprintSubscriptions = new Subscription();
  private readonly MAX_SAMPLES = 4;
  isFingerprintCapturing = signal(false);
  fingerprintMessage = signal('');
  fingerprintProgress = signal(0);
  readerConnected = signal(false);

  constructor(
    private userUseCases: UserUseCases,
    private roleUseCases: RoleUseCases,
    private storeUseCases: StoreUseCases,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    this.isLoading.set(true);
    this.subscribeToFingerprintEvents();
    this.loadUsers();
    this.isLoading.set(false);
  }

  ngOnDestroy(): void {
    this.fingerprintSubscriptions.unsubscribe();
    const fingerprintService = this.injector.get(FingerprintService);
    void fingerprintService.stopCapture();
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
    this.resetFingerprintCaptureState();
    this.showModal.set(true);
    this.errorMessage = '';
  }

  openEditModal(user: User): void {
    this.isEditing.set(true);

    this.editingUser = {
      ...user,
      fingerprintSamples: [],
      role: { ...user.role },
      store: user.store ? { ...user.store } : { id: '', name: '' } as Store
    };

    this.selectedRole = user.role;
    this.resetFingerprintCaptureState();
    this.showModal.set(true);
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetFingerprintCaptureState();
    const fingerprintService = this.injector.get(FingerprintService);
    void fingerprintService.stopCapture();

    this.editingUser = this.createEmptyUser();
    this.selectedRole = null;
    this.errorMessage = '';
  }

  saveUser(): void {
    if (!this.editingUser.name || !this.editingUser.email || !this.editingUser.role.code || (!this.editingUser.store.id && this.stores().length > 0)) {
      this.errorMessage = 'Nombre, email, rol y sucursal son requeridos';
      return;
    }

    if (!this.isEditing() && (!this.editingUser.fingerprintSamples || this.editingUser.fingerprintSamples.length !== 4)) {
      this.errorMessage = 'Debes capturar las 4 huellas antes de crear el usuario';
      return;
    }

    if (this.isEditing() && this.editingUser.fingerprintSamples && this.editingUser.fingerprintSamples.length > 0 && this.editingUser.fingerprintSamples.length !== 4) {
      this.errorMessage = 'Si vas a reemplazar la huella, debes capturar las 4 muestras';
      return;
    }

    const payload = {
      ...this.editingUser,
      fingerprintSamples: this.editingUser.fingerprintSamples ?? []
    };

    if (this.isEditing() && this.editingUser.id) {
      this.userUseCases.updateUser(this.editingUser.id, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();},
        error: (error) => {
          console.error('Error updating user:', error);
          this.errorMessage = 'Error al actualizar el usuario';}});
    } else {
      this.userUseCases.createUser(payload).subscribe({
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

  async captureFingerprintFromDevice(): Promise<void> {
    if (!this.showModal()) {
      return;
    }

    this.errorMessage = '';
    this.fingerprintMessage.set('Preparando captura de 4 huellas...');
    this.isFingerprintCapturing.set(true);
    this.fingerprintProgress.set(0);
    this.editingUser.fingerprintSamples = [];

    const fingerprintService = this.injector.get(FingerprintService);

    try {      
      const samples: string[] = [];

      for (let i = 0; i < this.MAX_SAMPLES; i++) {
        this.fingerprintMessage.set(`Coloca la huella ${i + 1} de ${this.MAX_SAMPLES}`);
        const sample = await fingerprintService.captureOnePng();

        samples.push(sample);
        this.fingerprintProgress.set(i + 1);
        this.fingerprintMessage.set(`Huella ${i + 1} capturada correctamente`);
      }

      this.editingUser.fingerprintSamples = samples;
      this.fingerprintMessage.set('Las 4 huellas fueron capturadas correctamente.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error ?? 'No se pudo iniciar la captura de huella.');

      this.errorMessage = message;
      this.fingerprintMessage.set('');
      this.editingUser.fingerprintSamples = [];
    } finally {
      this.isFingerprintCapturing.set(false);
      await fingerprintService.stopCapture();
    }
  }

  private createEmptyUser(): EditableUser {
    return {
      name: '',
      email: '',
      password: '',
      fingerprintSamples: [],
      role: { id: '', name: '', code: '' },
      store: { id: '', name: '' } as Store,
      isActive: true};
  }

  private resetFingerprintCaptureState(): void {
    this.isFingerprintCapturing.set(false);
    this.fingerprintMessage.set('');
  }

  private subscribeToFingerprintEvents(): void {
    const fingerprintService = this.injector.get(FingerprintService);
    this.fingerprintSubscriptions.add(
      fingerprintService.onDeviceStatus().subscribe((status) => {
        this.readerConnected.set(status === 'connected');

        if (!this.showModal()) {
          return;
        }

        if(this.isFingerprintCapturing()) {
          return;
        }

        if (status === 'connected' && !this.isFingerprintCapturing()) {
          this.fingerprintMessage.set(
            this.isFingerprintCapturing()
              ? 'Lector conectado. Mantén el dedo en el escáner.'
              : 'Lector conectado y listo para capturar.');

          return;
        }

        this.isFingerprintCapturing.set(false);
        this.fingerprintMessage.set('El lector de huellas se desconectó. Vuelve a conectarlo e intenta de nuevo.');
      })
    );
  }
}
