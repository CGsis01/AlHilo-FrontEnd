import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepairComplexityUseCases } from '../../../domain/usecases/repair-complexity.usecases';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { RepairComplexity } from '../../../core/models/repair-complexity.model';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-repair-complexities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair-complexities.component.html',
  styleUrls: ['./repair-complexities.component.scss']
})

export class RepairComplexitiesComponent implements OnInit {
  repairComplexities: RepairComplexity[] = [];
  stores: Store[] = [];
  isLoading = true;
  isEditing = false;
  editingRepairComplexity: Partial<RepairComplexity> = {};
  showModal = false;
  errorMessage = '';
  selectedStoreFilter: string = '';

  constructor(
    private repairComplexityUseCases: RepairComplexityUseCases,
    private storeUseCases: StoreUseCases
  ) {}

  ngOnInit(): void {
    this.loadStores();
    this.loadRepairComplexities();
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

  loadRepairComplexities(): void {
    this.isLoading = true;
    
    const loadMethod = this.selectedStoreFilter 
      ? this.repairComplexityUseCases.getRepairComplexitiesByStore(this.selectedStoreFilter)
      : this.repairComplexityUseCases.getAllRepairComplexities();
    
    loadMethod.subscribe({
      next: (repairComplexities) => {
        this.repairComplexities = repairComplexities;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading repair complexities:', error);
        this.isLoading = false;
      }
    });
  }

  onStoreFilterChange(): void {
    this.loadRepairComplexities();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingRepairComplexity = { 
      name: '', 
      code: '', 
      laborMultiplier: 1.0,
      timeMultiplier: 1.0,
      storeId: this.selectedStoreFilter || (this.stores.length > 0 ? this.stores[0].id : ''),
      isActive: true 
    };
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(repairComplexity: RepairComplexity): void {
    this.isEditing = true;
    this.editingRepairComplexity = { ...repairComplexity };
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingRepairComplexity = {};
    this.errorMessage = '';
  }

  saveRepairComplexity(): void {
    if (!this.editingRepairComplexity.name || this.editingRepairComplexity.name.trim() === '') {
      this.errorMessage = 'El nombre es requerido';
      return;
    }
    
    if (!this.editingRepairComplexity.code || this.editingRepairComplexity.code.trim() === '') {
      this.errorMessage = 'El código es requerido';
      return;
    }
    
    if (!this.editingRepairComplexity.laborMultiplier || this.editingRepairComplexity.laborMultiplier <= 0) {
      this.errorMessage = 'El multiplicador de mano de obra debe ser mayor a 0';
      return;
    }
    
    if (!this.editingRepairComplexity.timeMultiplier || this.editingRepairComplexity.timeMultiplier <= 0) {
      this.errorMessage = 'El multiplicador de tiempo debe ser mayor a 0';
      return;
    }
    
    if (!this.editingRepairComplexity.storeId) {
      this.errorMessage = 'La sucursal es requerida';
      return;
    }
    
    if (this.isEditing && this.editingRepairComplexity.id) {
      this.repairComplexityUseCases.updateRepairComplexity(this.editingRepairComplexity.id, this.editingRepairComplexity).subscribe({
        next: () => {
          this.loadRepairComplexities();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating repair complexity:', error);
          this.errorMessage = 'Error al actualizar la complejidad';
        }
      });
    } else {
      this.repairComplexityUseCases.createRepairComplexity(this.editingRepairComplexity).subscribe({
        next: () => {
          this.loadRepairComplexities();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating repair complexity:', error);
          this.errorMessage = 'Error al crear la complejidad';
        }
      });
    }
  }

  deleteRepairComplexity(repairComplexity: RepairComplexity): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la complejidad "${repairComplexity.name}"?`)) {
      this.repairComplexityUseCases.deleteRepairComplexity(repairComplexity.id).subscribe({
        next: () => {
          this.loadRepairComplexities();
        },
        error: (error) => {
          console.error('Error deleting repair complexity:', error);
          alert('Error al eliminar la complejidad');
        }
      });
    }
  }

  toggleStatus(repairComplexity: RepairComplexity): void {
    const action = repairComplexity.isActive 
      ? this.repairComplexityUseCases.deactivateRepairComplexity(repairComplexity.id) 
      : this.repairComplexityUseCases.activateRepairComplexity(repairComplexity.id);

    action.subscribe({
      next: () => {
        this.loadRepairComplexities();
      },
      error: (error) => {
        console.error('Error toggling repair complexity status:', error);
      }
    });
  }

  getStoreName(storeId: string): string {
    const store = this.stores.find(s => s.id === storeId);
    return store ? store.name : 'N/A';
  }

  onLaborMultiplierInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);
    this.editingRepairComplexity.laborMultiplier = parseFloat(sanitizedValue) || 0;
  }

  onLaborMultiplierBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.editingRepairComplexity.laborMultiplier !== undefined && this.editingRepairComplexity.laborMultiplier !== null) {
      const formatted = this.formatToTwoDecimals(this.editingRepairComplexity.laborMultiplier);
      input.value = formatted;
      this.editingRepairComplexity.laborMultiplier = parseFloat(formatted);
    }
  }

  onTimeMultiplierInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);
    this.editingRepairComplexity.timeMultiplier = parseFloat(sanitizedValue) || 0;
  }

  onTimeMultiplierBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.editingRepairComplexity.timeMultiplier !== undefined && this.editingRepairComplexity.timeMultiplier !== null) {
      const formatted = this.formatToTwoDecimals(this.editingRepairComplexity.timeMultiplier);
      input.value = formatted;
      this.editingRepairComplexity.timeMultiplier = parseFloat(formatted);
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
