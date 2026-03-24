import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GarmentUseCases } from '../../../domain/usecases/garment.usecases';
import { RepairTypeUseCases } from '../../../domain/usecases/repair-type.usecases';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { Garment, GarmentRepairType } from '../../../core/models/garment.model';
import { RepairType } from '../../../core/models/repair-type.model';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-garments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './garments.component.html',
  styleUrls: ['./garments.component.scss']
})

export class GarmentsComponent implements OnInit {
  garments: Garment[] = [];
  filteredGarments: Garment[] = [];
  stores: Store[] = [];
  repairTypes: RepairType[] = [];
  availableRepairTypes: RepairType[] = [];
  isLoading = true;
  isEditing = false;
  editingGarment: Partial<Garment> = {};
  showModal = false;
  showRepairTypesModal = false;
  errorMessage = '';
  selectedStoreId = '';
  
  // Repair type management
  selectedGarmentForRepairTypes: Garment | null = null;
  selectedRepairTypeId = '';
  repairTypeOptions = {
    isDefault: false,
    estimatedPriceOverride: undefined as number | undefined,
    estimatedTimeOverride: undefined as number | undefined,
    sortOrder: undefined as number | undefined
  };

  constructor(
    private garmentUseCases: GarmentUseCases,
    private repairTypeUseCases: RepairTypeUseCases,
    private storeUseCases: StoreUseCases
  ) {}

  ngOnInit(): void {
    this.loadStores();
    this.loadRepairTypes();
    this.loadGarments();
  }

  loadStores(): void {
    this.storeUseCases.getActiveStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        if (this.stores.length > 0 && !this.selectedStoreId) {
          this.selectedStoreId = 'all';
        }
      },
      error: (error) => {
        console.error('Error loading stores:', error);
      }
    });
  }

  loadRepairTypes(): void {
    this.repairTypeUseCases.getAllRepairTypes().subscribe({
      next: (repairTypes) => {
        this.repairTypes = repairTypes.filter(rt => rt.isActive);
      },
      error: (error) => {
        console.error('Error loading repair types:', error);
      }
    });
  }

  loadGarments(): void {
    this.isLoading = true;
    
    const observable = this.selectedStoreId && this.selectedStoreId !== 'all'
      ? this.garmentUseCases.getGarmentsByStore(this.selectedStoreId)
      : this.garmentUseCases.getAllGarments();

    observable.subscribe({
      next: (garments) => {
        this.garments = garments;
        this.filteredGarments = garments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading garments:', error);
        this.isLoading = false;
      }
    });
  }

  onStoreChange(): void {
    this.loadGarments();
  }

  getStoreName(storeId: string): string {
    const store = this.stores.find(s => s.id === storeId);
    return store ? store.name : '-';
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingGarment = { 
      name: '', 
      code: '', 
      description: '', 
      category: '',
      storeId: this.selectedStoreId !== 'all' ? this.selectedStoreId : this.stores[0]?.id || '',
      isActive: true,
      repairTypes: []
    };
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(garment: Garment): void {
    this.isEditing = true;
    this.editingGarment = { ...garment };
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingGarment = {};
    this.errorMessage = '';
  }

  saveGarment(): void {
    if (!this.editingGarment.name || this.editingGarment.name.trim() === '') {
      this.errorMessage = 'El nombre es requerido';
      return;
    }
    
    if (!this.editingGarment.code || this.editingGarment.code.trim() === '') {
      this.errorMessage = 'El código es requerido';
      return;
    }

    if (!this.editingGarment.storeId) {
      this.errorMessage = 'La sucursal es requerida';
      return;
    }
    
    if (this.isEditing && this.editingGarment.id) {
      this.garmentUseCases.updateGarment(this.editingGarment.id, this.editingGarment).subscribe({
        next: () => {
          this.loadGarments();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating garment:', error);
          this.errorMessage = 'Error al actualizar la prenda';
        }
      });
    } else {
      this.garmentUseCases.createGarment(this.editingGarment).subscribe({
        next: () => {
          this.loadGarments();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating garment:', error);
          this.errorMessage = 'Error al crear la prenda';
        }
      });
    }
  }

  deleteGarment(garment: Garment): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la prenda "${garment.name}"?`)) {
      this.garmentUseCases.deleteGarment(garment.id).subscribe({
        next: () => {
          this.loadGarments();
        },
        error: (error) => {
          console.error('Error deleting garment:', error);
          alert('Error al eliminar la prenda');
        }
      });
    }
  }

  toggleStatus(garment: Garment): void {
    const action = garment.isActive 
      ? this.garmentUseCases.deactivateGarment(garment.id) 
      : this.garmentUseCases.activateGarment(garment.id);

    action.subscribe({
      next: () => {
        this.loadGarments();
      },
      error: (error) => {
        console.error('Error toggling garment status:', error);
      }
    });
  }

  // Repair Types Management
  openRepairTypesModal(garment: Garment): void {
    this.selectedGarmentForRepairTypes = garment;
    this.updateAvailableRepairTypes(garment);
    this.resetRepairTypeOptions();
    this.showRepairTypesModal = true;
  }

  closeRepairTypesModal(): void {
    this.showRepairTypesModal = false;
    this.selectedGarmentForRepairTypes = null;
    this.selectedRepairTypeId = '';
    this.resetRepairTypeOptions();
  }

  updateAvailableRepairTypes(garment: Garment): void {
    const assignedRepairTypeIds = garment.repairTypes.map(rt => rt.repairTypeId);
    this.availableRepairTypes = this.repairTypes.filter(
      rt => !assignedRepairTypeIds.includes(rt.id)
    );
  }

  addRepairTypeToGarment(): void {
    if (!this.selectedGarmentForRepairTypes || !this.selectedRepairTypeId) {
      return;
    }

    const garmentId = this.selectedGarmentForRepairTypes.id;

    this.garmentUseCases.addRepairTypeToGarment(
      garmentId,
      this.selectedRepairTypeId,
      this.selectedGarmentForRepairTypes.storeId,
      {
        isDefault: this.repairTypeOptions.isDefault,
        estimatedPriceOverride: this.repairTypeOptions.estimatedPriceOverride,
        estimatedTimeOverride: this.repairTypeOptions.estimatedTimeOverride,
        sortOrder: this.repairTypeOptions.sortOrder
      }
    ).subscribe({
      next: () => {
        // Reload garments and then update the modal
        const observable = this.selectedStoreId && this.selectedStoreId !== 'all'
          ? this.garmentUseCases.getGarmentsByStore(this.selectedStoreId)
          : this.garmentUseCases.getAllGarments();

        observable.subscribe({
          next: (garments) => {
            this.garments = garments;
            this.filteredGarments = garments;
            
            // Now update the modal with the refreshed data
            const updatedGarment = this.filteredGarments.find(g => g.id === garmentId);
            if (updatedGarment) {
              this.selectedGarmentForRepairTypes = updatedGarment;
              this.updateAvailableRepairTypes(updatedGarment);
            }
            
            this.resetRepairTypeOptions();
            this.selectedRepairTypeId = '';
          },
          error: (error) => {
            console.error('Error reloading garments:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error adding repair type:', error);
        alert('Error al agregar el tipo de reparación');
      }
    });
  }

  onDecimalInput(event: Event, field: 'estimatedPriceOverride' | 'estimatedTimeOverride'): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Remove any characters that are not numbers or decimal point
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    input.value = value;
    const numValue = value === '' ? undefined : parseFloat(value);
    this.repairTypeOptions[field] = numValue;
  }

  formatToTwoDecimals(event: Event, field: 'estimatedPriceOverride' | 'estimatedTimeOverride'): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    
    if (!isNaN(value)) {
      input.value = value.toFixed(2);
      this.repairTypeOptions[field] = value;
    }
  }

  resetRepairTypeOptions(): void {
    this.repairTypeOptions = {
      isDefault: false,
      estimatedPriceOverride: undefined,
      estimatedTimeOverride: undefined,
      sortOrder: undefined
    };
  }

  getRepairTypeNames(garment: Garment): string {
    if (!garment.repairTypes || garment.repairTypes.length === 0) {
      return '-';
    }
    return garment.repairTypes.map(rt => rt.repairTypeName).join(', ');
  }
}
