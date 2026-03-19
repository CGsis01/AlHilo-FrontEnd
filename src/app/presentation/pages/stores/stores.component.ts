import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stores.component.html',
  styleUrls: ['./stores.component.scss']
})

export class StoresComponent implements OnInit {
  stores: Store[] = [];
  isLoading = true;
  isEditing = false;
  editingStore: Partial<Store> = {};
  showModal = false;
  errorMessage = '';

  constructor(private storeUseCases: StoreUseCases) {}

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.isLoading = true;
    
    this.storeUseCases.getAllStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        this.isLoading = false;},
      error: (error) => {
        console.error('Error loading stores:', error);
        this.isLoading = false;}});
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingStore = { 
      name: '', 
      address: '', 
      phone: '', 
      email: '', 
      rfc: '', 
      url: '', 
      logo: '',
      isActive: true 
    };
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(store: Store): void {
    this.isEditing = true;
    this.editingStore = { ...store };
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingStore = {};
    this.errorMessage = '';
  }

  saveStore(): void {
    if (!this.editingStore.name || this.editingStore.name.trim() === '') {
      this.errorMessage = 'El nombre es requerido';
      
      return;
    }
    
    if (this.isEditing && this.editingStore.id) {
      this.storeUseCases.updateStore(this.editingStore.id, this.editingStore).subscribe({
        next: () => {
          this.loadStores();
          this.closeModal();},
        error: (error) => {
          console.error('Error updating store:', error);
          this.errorMessage = 'Error al actualizar la sucursal';}});
    } else {
      this.storeUseCases.createStore(this.editingStore).subscribe({
        next: () => {
          this.loadStores();
          this.closeModal();},
        error: (error) => {
          console.error('Error creating store:', error);
          this.errorMessage = 'Error al crear la sucursal';}});
    }
  }

  deleteStore(store: Store): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la sucursal "${store.name}"?`)) {
      this.storeUseCases.deleteStore(store.id).subscribe({
        next: () => {
          this.loadStores();},
        error: (error) => {
          console.error('Error deleting store:', error);
          alert('Error al eliminar la sucursal');}});
    }
  }

  toggleStatus(store: Store): void {
    const action = store.isActive 
      ? this.storeUseCases.deactivateStore(store.id) 
      : this.storeUseCases.activateStore(store.id);

    action.subscribe({
      next: () => {
        this.loadStores();},
      error: (error) => {
        console.error('Error toggling store status:', error);}});
  }
}
