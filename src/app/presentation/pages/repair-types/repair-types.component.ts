import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepairTypeUseCases } from '../../../domain/usecases/repair-type.usecases';
import { RepairType } from '../../../core/models/repair-type.model';

@Component({
  selector: 'app-repair-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair-types.component.html',
  styleUrls: ['./repair-types.component.scss']
})

export class RepairTypesComponent implements OnInit {
  repairTypes: RepairType[] = [];
  isLoading = true;
  isEditing = false;
  editingRepairType: Partial<RepairType> = {};
  showModal = false;
  errorMessage = '';

  constructor(private repairTypeUseCases: RepairTypeUseCases) {}

  ngOnInit(): void {
    this.loadRepairTypes();
  }

  loadRepairTypes(): void {
    this.isLoading = true;
    this.repairTypeUseCases.getAllRepairTypes().subscribe({
      next: (repairTypes) => {
        this.repairTypes = repairTypes;
        this.isLoading = false;},
      error: (error) => {
        console.error('Error loading repair types:', error);
        this.isLoading = false;}});
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingRepairType = {
      name: '',
      code: '',
      estimatedPrice: 0,
      estimatedTime: 0};
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(repairType: RepairType): void {
    this.isEditing = true;
    this.editingRepairType = { ...repairType };
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingRepairType = {};
    this.errorMessage = '';
  }

  saveRepairType(): void {
    if (!this.editingRepairType.name || !this.editingRepairType.code) {
      this.errorMessage = 'Nombre y código son requeridos';
      
      return;
    }

    if (!this.editingRepairType.estimatedPrice || this.editingRepairType.estimatedPrice <= 0) {
      this.errorMessage = 'El precio estimado debe ser mayor a 0';
      
      return;
    }

    if (!this.editingRepairType.estimatedTime || this.editingRepairType.estimatedTime <= 0) {
      this.errorMessage = 'El tiempo estimado debe ser mayor a 0';
      
      return;
    }
    
    if (this.isEditing && this.editingRepairType.id) {
      this.repairTypeUseCases.updateRepairType(this.editingRepairType.id, this.editingRepairType).subscribe({
        next: () => {
          this.loadRepairTypes();
          this.closeModal();},
        error: (error) => {
          console.error('Error updating repair type:', error);
          this.errorMessage = 'Error al actualizar el tipo de compostura';}});
    } else {
      this.repairTypeUseCases.createRepairType(this.editingRepairType).subscribe({
        next: () => {
          this.loadRepairTypes();
          this.closeModal();},
        error: (error) => {
          console.error('Error creating repair type:', error);
          this.errorMessage = 'Error al crear el tipo de compostura';}});
    }
  }

  deleteRepairType(repairType: RepairType): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el tipo de compostura "${repairType.name}"?`)) {
      this.repairTypeUseCases.deleteRepairType(repairType.id).subscribe({
        next: () => {
          this.loadRepairTypes();},
        error: (error) => {
          console.error('Error deleting repair type:', error);
          alert('Error al eliminar el tipo de compostura');}});
    }
  }

  toggleStatus(repairType: RepairType): void {
    const action = repairType.isActive 
      ? this.repairTypeUseCases.deactivateRepairType(repairType.id) 
      : this.repairTypeUseCases.activateRepairType(repairType.id);

    action.subscribe({
      next: () => {
        this.loadRepairTypes();},
      error: (error) => {
        console.error('Error toggling repair type status:', error);}});
  }

  onEstimatedPriceInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);

    this.editingRepairType.estimatedPrice = parseFloat(sanitizedValue) || 0;
  }

  onEstimatedTimeInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);
    
    this.editingRepairType.estimatedTime = parseFloat(sanitizedValue) || 0;
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
}
