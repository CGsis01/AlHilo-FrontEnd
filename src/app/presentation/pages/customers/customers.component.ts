import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientUseCases } from '../../../domain/usecases/client.usecases';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { Client } from '../../../core/models/client.model';
import { Store } from '../../../core/models/store.model';
import { ToastService } from '../../../core/services/toast.service';
import { DateFormatDirective } from '../../../shared/directives/date-format.directive';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFormatDirective],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})

export class CustomersComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  stores: Store[] = [];
  selectedStore: Store | null = null;
  selectedStoreFilter: string = '';
  isLoading = true;
  isEditing = false;
  showModal = false;
  errorMessage = '';
  searchQuery = '';

  editingClient: Partial<Omit<Client, 'store'>> & { store: Partial<Store>; } = { store: { id: '', name: '' } as Store };
  birthDateStr = '';

  constructor(
    private clientUseCases: ClientUseCases,
    private storeUseCases: StoreUseCases,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.loadStores();
    this.loadClients();

    this.isLoading = false;
  }

  loadStores(): void {
    this.storeUseCases.getActiveStores().subscribe({
      next: (stores) => { this.stores = stores; },
      error: (error) => { console.error('Error loading stores:', error); }});
  }

  loadClients(): void {
    const loadMethod = this.selectedStoreFilter 
      ? this.clientUseCases.getClientsByStore(this.selectedStoreFilter)
      : this.clientUseCases.getAllClients();
    
    loadMethod.subscribe({
      next: (clients) => {
        this.clients = clients;
        this.applyFilter();},
      error: (error) => { this.toastService.show('Error al cargar los clientes: ' + error.message, 'error');}});
  }

  applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    
    if (!q) {
      this.filteredClients = [...this.clients];
      
      return;
    }

    this.filteredClients = this.clients.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.personalPhone.includes(q) ||
      (c.email ?? '').toLowerCase().includes(q));
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingClient = {store: { id: '', name: '' } as Store };
    this.birthDateStr = '';
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(client: Client): void {
    this.isEditing = true;
    this.editingClient = { ...client, store: client.store ? { ...client.store } : { id: '', name: '' } as Store };
    this.birthDateStr = client.birthDate ? this.dateToYMD(new Date(client.birthDate)) : '';
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingClient = { store: { id: '', name: '' } as Store };
    this.birthDateStr = '';
    this.errorMessage = '';
  }

  saveClient(): void {
    if (!this.editingClient.fullName?.trim()) {
      this.errorMessage = 'El nombre completo es requerido';
      
      return;
    }

    if (!this.editingClient.personalPhone?.trim() || !/^\d{10}$/.test(this.editingClient.personalPhone)) {
      this.errorMessage = 'El teléfono personal debe tener 10 dígitos';
      
      return;
    }

    if (!this.editingClient.contactPhone?.trim() || !/^\d{10}$/.test(this.editingClient.contactPhone)) {
      this.errorMessage = 'El teléfono de contacto debe tener 10 dígitos';
      
      return;
    }

    if (!this.editingClient.address?.trim()) {
      this.errorMessage = 'La dirección es requerida';
      
      return;
    }

    if(!this.editingClient.store?.id) {
      this.errorMessage = 'La sucursal es requerida';
      
      return;
    }

    if (this.isEditing && this.editingClient.id) {
      
      this.clientUseCases.updateClient(this.editingClient.id, {
        ...this.editingClient,
        birthDate: this.birthDateStr ? new Date(this.birthDateStr) : undefined,
        store: this.editingClient.store && this.editingClient.store.id
          ? { id: this.editingClient.store.id, name: this.editingClient.store.name } as Store
          : undefined
      }).subscribe({
        next: () => {
          this.toastService.show('Cliente actualizado correctamente', 'success');
          this.loadClients();
          this.closeModal();},
        error: () => {
          this.errorMessage = 'Error al actualizar el cliente';}});
    } else {
      this.clientUseCases.createClient({
        ...this.editingClient,
        birthDate: this.birthDateStr ? new Date(this.birthDateStr) : undefined,
        store: this.editingClient.store && this.editingClient.store.id
          ? { id: this.editingClient.store.id, name: this.editingClient.store.name } as Store
          : undefined
      }).subscribe({
        next: () => {
          this.toastService.show('Cliente creado correctamente', 'success');
          this.loadClients();
          this.closeModal();},
        error: () => {
          this.errorMessage = 'Error al crear el cliente';}});}
  }

  deleteClient(client: Client): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${client.fullName}"?`)) return;

    this.clientUseCases.deleteClient(client.id).subscribe({
      next: () => {
        this.toastService.show('Cliente eliminado correctamente', 'success');
        this.loadClients();},
      error: () => {
        this.toastService.show('Error al eliminar el cliente', 'error');}});
  }

  onPhoneInput(event: Event, field: 'personalPhone' | 'contactPhone'): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/\D/g, '').slice(0, 10);
    
    if (input.value !== sanitized) input.value = sanitized;
    
    this.editingClient[field] = sanitized;
  }

  onStoreChange(storeIdOrEvent: string | Event): void {
    const storeId = typeof storeIdOrEvent === 'string'
      ? storeIdOrEvent
      : ((storeIdOrEvent.target as HTMLSelectElement | null)?.value ?? '');
    
      this.selectedStore = this.stores.find(store => store.id === storeId) || null;
      
      this.editingClient.store = this.selectedStore
      ? { id: this.selectedStore.id, name: this.selectedStore.name } as Store
      : { id: '', name: '' } as Store;
  }

  onStoreFilterChange(): void {
    this.isLoading = true;
    
    this.loadClients();

    this.isLoading = false;
  }

  private dateToYMD(d: Date): string {
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }
}
