import { Component, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GarmentUseCases } from '../../../domain/usecases/garment.usecases';
import { RepairTypeUseCases } from '../../../domain/usecases/repair-type.usecases';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { Garment } from '../../../core/models/garment.model';
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
  garments = signal<Garment[]>([]);
  filteredGarments = signal<Garment[]>([]);
  
  isLoading = signal(true);
  isEditing = signal(false);
  showModal = signal(false);
  showRepairTypesModal = signal(false);
  errorMessage = signal('');
  selectedStore = 'all';
  
  editingGarment: Partial<Garment> = {};
  availableRepairTypes: RepairType[] = [];

  // Repair type management
  selectedGarmentForRepairTypes: Garment | null = null;
  selectedRepairTypeId = '';
  repairTypeSearchTerm = '';
  filteredAvailableRepairTypes: RepairType[] = [];
  showRepairTypeSuggestions = false;
  repairTypeOptions = {
    isDefault: false,
    estimatedPriceOverride: undefined as number | undefined,
    estimatedTimeOverride: undefined as number | undefined,
    sortOrder: undefined as number | undefined
  };

  stores = toSignal(
    this.storeUseCases.getActiveStores().pipe(
      catchError(err => {
        console.error('Error loading stores:', err);
        return of([] as Store[]);
      })
    ),
    { initialValue: [] as Store[] }
  );

  repairTypes = toSignal(
    this.repairTypeUseCases.getAllRepairTypes().pipe(
      catchError(err => {
        console.error('Error loading repair types:', err);
        return of([] as RepairType[]);
      })
    ),
    { initialValue: [] as RepairType[] }
  );

  // Modal to Add/Edit RepairType state
  modalTitle = computed(() => this.isEditing() ? 'Editar Prenda' : 'Agregar Prenda');
  saveButtonLabel = computed(() => this.isEditing() ? 'Actualizar' : 'Crear');

  constructor(
    private garmentUseCases: GarmentUseCases,
    private repairTypeUseCases: RepairTypeUseCases,
    private storeUseCases: StoreUseCases
  ) {}

  ngOnInit(): void {
    this.loadGarments();
  }

  loadGarments(): void {
    this.isLoading.set(true);
    
    const observable = this.selectedStore && this.selectedStore !== 'all'
      ? this.garmentUseCases.getGarmentsByStore(this.selectedStore)
      : this.garmentUseCases.getAllGarments();

    observable.subscribe({
      next: (garments) => {
        this.garments.set(garments);
        this.filteredGarments.set(garments);},
      error: (error) => { console.error('Error loading garments:', error); }});

    this.isLoading.set(false);
  }

  onStoreChange(): void {
    this.loadGarments();
  }

  getStoreName(storeId: string): string {
    const store = this.stores().find(s => s.id === storeId);
    return store ? store.name : '-';
  }

  openAddModal(): void {
    this.isEditing.set(false);
    
    this.editingGarment = { 
      name: '', 
      code: '', 
      description: '', 
      category: '',
      storeId: '',
      isActive: true,
      repairTypes: []
    };
    
    this.showModal.set(true);
    this.errorMessage.set('');
  }

  openEditModal(garment: Garment): void {
    this.isEditing.set(true);
    
    this.editingGarment = { ...garment };
    
    this.showModal.set(true);
    this.errorMessage.set('');
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingGarment = {};
    this.errorMessage.set('');
  }

  saveGarment(): void {
    if (!this.editingGarment.name || this.editingGarment.name.trim() === '') {
      this.errorMessage.set('El nombre es requerido');
      return;
    }
    
    if (!this.editingGarment.code || this.editingGarment.code.trim() === '') {
      this.errorMessage.set('El código es requerido');
      return;
    }

    if (!this.editingGarment.storeId) {
      this.errorMessage.set('La sucursal es requerida');
      return;
    }
    
    if (this.isEditing() && this.editingGarment.id) {
      this.garmentUseCases.updateGarment(this.editingGarment.id, this.editingGarment).subscribe({
        next: () => {
          this.loadGarments();
          this.closeModal();},
        error: (error) => {
          console.error('Error updating garment:', error);
          this.errorMessage.set('Error al actualizar la prenda');}});
    } else {
      this.garmentUseCases.createGarment(this.editingGarment).subscribe({
        next: () => {
          this.loadGarments();
          this.closeModal();},
        error: (error) => {
          console.error('Error creating garment:', error);
          this.errorMessage.set('Error al crear la prenda');}});
    }
  }

  deleteGarment(garment: Garment): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la prenda "${garment.name}"?`)) {
      this.garmentUseCases.deleteGarment(garment.id).subscribe({
        next: () => { this.loadGarments(); },
        error: (error) => {
          console.error('Error deleting garment:', error);
          alert('Error al eliminar la prenda'); }});
    }
  }

  toggleStatus(garment: Garment): void {
    const action = garment.isActive 
      ? this.garmentUseCases.deactivateGarment(garment.id) 
      : this.garmentUseCases.activateGarment(garment.id);

    action.subscribe({
      next: () => { this.loadGarments(); },
      error: (error) => { console.error('Error toggling garment status:', error); }});
  }

  // Repair Types Management
  openRepairTypesModal(garment: Garment): void {
    this.selectedGarmentForRepairTypes = garment;
    this.updateAvailableRepairTypes(garment);
    this.resetRepairTypeOptions();
    this.showRepairTypesModal.set(true);
  }

  closeRepairTypesModal(): void {
    this.showRepairTypesModal.set(false);
    this.selectedGarmentForRepairTypes = null;
    this.selectedRepairTypeId = '';
    this.repairTypeSearchTerm = '';
    this.filteredAvailableRepairTypes = [];
    this.showRepairTypeSuggestions = false;
    this.resetRepairTypeOptions();
  }

  updateAvailableRepairTypes(garment: Garment): void {
    const repairTypesByStore = this.repairTypes().filter(rt => rt.store.id === garment.storeId);
    this.availableRepairTypes = repairTypesByStore.filter(rt => !garment.repairTypes.some(grt => grt.repairTypeId === rt.id));
    this.filterAvailableRepairTypes();
  }

  onRepairTypeSearchInput(): void {
    this.selectedRepairTypeId = '';
    this.filterAvailableRepairTypes();
    this.showRepairTypeSuggestions = true;
  }

  onRepairTypeSearchFocus(): void {
    this.filterAvailableRepairTypes();
    this.showRepairTypeSuggestions = true;
  }

  onRepairTypeSearchBlur(): void {
    // Delay lets click on suggestion run before hiding the list.
    setTimeout(() => {
      this.showRepairTypeSuggestions = false;
    }, 150);
  }

  selectRepairType(repairType: RepairType): void {
    this.selectedRepairTypeId = repairType.id;
    this.repairTypeSearchTerm = `${repairType.name} (${repairType.code})`;
    this.showRepairTypeSuggestions = false;
  }

  private filterAvailableRepairTypes(): void {
    const term = this.repairTypeSearchTerm.trim().toLowerCase();

    this.filteredAvailableRepairTypes = term
      ? this.availableRepairTypes.filter(rt => {
          const name = rt.name.toLowerCase();
          const code = rt.code.toLowerCase();
          return name.includes(term) || code.includes(term);
        })
      : [...this.availableRepairTypes];
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
        const observable = this.selectedStore && this.selectedStore !== 'all'
          ? this.garmentUseCases.getGarmentsByStore(this.selectedStore)
          : this.garmentUseCases.getAllGarments();

        observable.subscribe({
          next: (garments) => {
            this.garments.set(garments);
            this.filteredGarments.set(garments);
            
            // Now update the modal with the refreshed data
            const updatedGarment = this.filteredGarments().find(g => g.id === garmentId);
            if (updatedGarment) {
              this.selectedGarmentForRepairTypes = updatedGarment;
              this.updateAvailableRepairTypes(updatedGarment);
            }
            
            this.resetRepairTypeOptions();
            this.selectedRepairTypeId = '';
            this.repairTypeSearchTerm = '';
            this.filterAvailableRepairTypes();
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
