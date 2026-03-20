import { Component, OnInit } from '@angular/core';
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
  materials: Material[] = [];
  stores: Store[] = [];
  isLoading = true;
  isEditing = false;
  editingMaterial: Partial<Material> = {};
  showModal = false;
  errorMessage = '';
  selectedStoreFilter: string = '';

  constructor(
    private materialUseCases: MaterialUseCases,
    private storeUseCases: StoreUseCases
  ) {}

  ngOnInit(): void {
    this.loadStores();
    this.loadMaterials();
  }

  loadStores(): void {
    this.storeUseCases.getActiveStores().subscribe({
      next: (stores) => {
        this.stores = stores;
      },
      error: (error) => {
        console.error('Error loading stores:', error);
      }
    });
  }

  loadMaterials(): void {
    this.isLoading = true;
    
    const loadMethod = this.selectedStoreFilter 
      ? this.materialUseCases.getMaterialsByStore(this.selectedStoreFilter)
      : this.materialUseCases.getAllMaterials();
    
    loadMethod.subscribe({
      next: (materials) => {
        this.materials = materials;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading materials:', error);
        this.isLoading = false;
      }
    });
  }

  onStoreFilterChange(): void {
    this.loadMaterials();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingMaterial = { 
      name: '', 
      unit: '', 
      unitCost: 0,
      storeId: this.selectedStoreFilter || (this.stores.length > 0 ? this.stores[0].id : ''),
      isActive: true 
    };
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(material: Material): void {
    this.isEditing = true;
    this.editingMaterial = { ...material };
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingMaterial = {};
    this.errorMessage = '';
  }

  saveMaterial(): void {
    if (!this.editingMaterial.name || this.editingMaterial.name.trim() === '') {
      this.errorMessage = 'El nombre es requerido';
      return;
    }
    
    if (!this.editingMaterial.unit || this.editingMaterial.unit.trim() === '') {
      this.errorMessage = 'La unidad es requerida';
      return;
    }
    
    if (!this.editingMaterial.unitCost || this.editingMaterial.unitCost <= 0) {
      this.errorMessage = 'El costo unitario debe ser mayor a 0';
      return;
    }
    
    if (!this.editingMaterial.storeId) {
      this.errorMessage = 'La sucursal es requerida';
      return;
    }
    
    if (this.isEditing && this.editingMaterial.id) {
      this.materialUseCases.updateMaterial(this.editingMaterial.id, this.editingMaterial).subscribe({
        next: () => {
          this.loadMaterials();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating material:', error);
          this.errorMessage = 'Error al actualizar el material';
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
          this.errorMessage = 'Error al crear el material';
        }
      });
    }
  }

  deleteMaterial(material: Material): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el material "${material.name}"?`)) {
      this.materialUseCases.deleteMaterial(material.id).subscribe({
        next: () => {
          this.loadMaterials();
        },
        error: (error) => {
          console.error('Error deleting material:', error);
          alert('Error al eliminar el material');
        }
      });
    }
  }

  toggleStatus(material: Material): void {
    const action = material.isActive 
      ? this.materialUseCases.deactivateMaterial(material.id) 
      : this.materialUseCases.activateMaterial(material.id);

    action.subscribe({
      next: () => {
        this.loadMaterials();
      },
      error: (error) => {
        console.error('Error toggling material status:', error);
      }
    });
  }

  getStoreName(storeId: string): string {
    const store = this.stores.find(s => s.id === storeId);
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
