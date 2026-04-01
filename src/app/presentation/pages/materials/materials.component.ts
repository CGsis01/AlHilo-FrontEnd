import { Component, OnInit, signal,computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialUseCases } from '../../../domain/usecases/material.usecases';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { Material } from '../../../core/models/material.model';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.scss']
})

export class MaterialsComponent implements OnInit {
  materials = signal<Material[]>([]);
  
  isLoading = signal(true);
  isEditing = signal(false);
  showModal = signal(false);
  errorMessage = signal('');

  stores = toSignal(
      this.storeUseCases.getActiveStores().pipe(
        catchError(err => {
          console.error('Error loading available stores:', err);
          return of([] as Store[]);
        })
      ),
      { initialValue: [] as Store[] }
    );

  editingMaterial: Partial<Material> = {};
  selectedStoreFilter: string = '';

  // Modal to Add/Edit Materials state
  modalTitle = computed(() => this.isEditing() ? 'Editar Material' : 'Agregar Material');
  saveButtonLabel = computed(() => this.isEditing() ? 'Actualizar' : 'Crear');

  constructor(
    private materialUseCases: MaterialUseCases,
    private storeUseCases: StoreUseCases
  ) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.isLoading.set(true);
    
    const loadMethod = this.selectedStoreFilter 
      ? this.materialUseCases.getMaterialsByStore(this.selectedStoreFilter)
      : this.materialUseCases.getAllMaterials();
    
    loadMethod.subscribe({
      next: (materials) => { this.materials.set(materials); },
      error: (error) => { console.error('Error loading materials:', error); }});
    
      this.isLoading.set(false);
  }

  onStoreFilterChange(): void {
    this.loadMaterials();
  }

  openAddModal(): void {
    this.isEditing.set(false);
    
    this.editingMaterial = { 
      name: '', 
      unit: '', 
      unitCost: 0,
      storeId: '',
      isActive: true 
    };
    
    this.showModal.set(true);
    this.errorMessage.set('');
  }

  openEditModal(material: Material): void {
    this.isEditing.set(true);

    this.editingMaterial = { ...material };
    
    this.showModal.set(true);
    this.errorMessage.set('');
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingMaterial = {};
    this.errorMessage.set('');
  }

  saveMaterial(): void {
    if (!this.editingMaterial.name || this.editingMaterial.name.trim() === '') {
      this.errorMessage.set('El nombre es requerido');
      return;
    }
    
    if (!this.editingMaterial.unit || this.editingMaterial.unit.trim() === '') {
      this.errorMessage.set('La unidad es requerida');
      return;
    }
    
    if (!this.editingMaterial.unitCost || this.editingMaterial.unitCost <= 0) {
      this.errorMessage.set('El costo unitario debe ser mayor a 0');
      return;
    }
    
    if (!this.editingMaterial.storeId) {
      this.errorMessage.set('La sucursal es requerida');
      return;
    }
    
    if (this.isEditing() && this.editingMaterial.id) {
      this.materialUseCases.updateMaterial(this.editingMaterial.id, this.editingMaterial).subscribe({
        next: () => {
          this.loadMaterials();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating material:', error);
          this.errorMessage.set('Error al actualizar el material');
        }
      });
    } else {
      this.materialUseCases.createMaterial(this.editingMaterial).subscribe({
        next: () => {
          this.loadMaterials();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating material:', error);
          this.errorMessage.set('Error al crear el material');
        }
      });
    }
  }

  deleteMaterial(material: Material): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el material "${material.name}"?`)) {
      this.materialUseCases.deleteMaterial(material.id).subscribe({
        next: () => { this.loadMaterials(); },
        error: (error) => {
          console.error('Error deleting material:', error);
          alert('Error al eliminar el material');
        }
      });
    }
  }

  toggleStatus(material: Material): void {
    const action = material.isActive 
      ? this.materialUseCases.deactivateMaterial(material.id, material.storeId) 
      : this.materialUseCases.activateMaterial(material.id, material.storeId);

    action.subscribe({
      next: () => { this.loadMaterials(); },
      error: (error) => { console.error('Error toggling material status:', error); }});
  }

  getStoreName(storeId: string): string {
    const store = this.stores().find(s => s.id === storeId);
    
    return store ? store.name : 'N/A';
  }

  onCostInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);
    this.editingMaterial.unitCost = parseFloat(sanitizedValue) || 0;
  }

  onCostBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (this.editingMaterial.unitCost !== undefined && this.editingMaterial.unitCost !== null) {
      const formatted = this.formatToTwoDecimals(this.editingMaterial.unitCost);
      input.value = formatted;
      this.editingMaterial.unitCost = parseFloat(formatted);
    }
  }

  onDecimalInput(event: Event): string {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1');

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    return sanitizedValue;
  }

  private formatToTwoDecimals(value: number | undefined | null): string {
    if (value === null || value === undefined) {
      return '0.00';
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return '0.00';
    }

    return numericValue.toFixed(2);
  }
}
