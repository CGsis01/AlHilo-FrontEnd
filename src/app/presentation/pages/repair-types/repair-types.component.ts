import { Component, computed, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepairTypeUseCases } from '../../../domain/usecases/repair-type.usecases';
import { RepairTypeRelationUseCases } from '../../../domain/usecases/repair-type-relation.usecases';
import { MaterialUseCases } from '../../../domain/usecases/material.usecases';
import { RepairComplexityUseCases } from '../../../domain/usecases/repair-complexity.usecases';
import { RepairType } from '../../../core/models/repair-type.model';
import { RepairTypeMaterial } from '../../../core/models/repair-type-material.model';
import { Material } from '../../../core/models/material.model';
import { RepairComplexity } from '../../../core/models/repair-complexity.model';
import { StoreUseCases } from '../../../domain/usecases/store.usecases';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-repair-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair-types.component.html',
  styleUrls: ['./repair-types.component.scss']
})

export class RepairTypesComponent implements OnInit {
  repairTypes = signal<RepairType[]>([]);
  
  isLoading = signal(true);
  isEditing = signal(false);
  showModal = signal(false);

  editingRepairType: Partial<RepairType> = {};
  
  errorMessage = '';

  // Material relations modal state
  showRelationsModal = signal(false);
  selectedRepairType: RepairType | null = null;

  // Materials relation state
  materialRelations: RepairTypeMaterial[] = [];
  availableMaterials = toSignal(
    this.materialUseCases.getActiveMaterials().pipe(
      catchError(err => {
        console.error('Error loading available materials:', err);
        return of([] as Material[]);
      })
    ),
    { initialValue: [] as Material[] }
  );

  isLoadingMaterials = signal(false);
  showMaterialForm = signal(false);
  isEditingMaterial = signal(false);
  editingMaterialRelation: { 
    repairTypeId: string; 
    materialId: string; 
    quantity: number; 
    unitCost: number; 
    isOptional: boolean;
    sortOrder: number;
    storeId: string;
  } = { repairTypeId: '', materialId: '', quantity: 0, unitCost: 0, isOptional: false, sortOrder: 0, storeId: '' };
  materialRelationError = '';

  // Delete confirmation modal state
  showDeleteMaterialModal = signal(false);
  deletingMaterialRelation: RepairTypeMaterial | null = null;

  // Complexities relation state
  selectedComplexity: RepairComplexity | null = null;
  availableComplexities = toSignal(
    this.complexityUseCases.getActiveRepairComplexities().pipe(
      catchError(err => {
        console.error('Error loading available complexities:', err);
        return of([] as RepairComplexity[]);
      })
    ),
    { initialValue: [] as RepairComplexity[] }
  );

  selectedStoreFilter: string = '';
  selectedStore: Store | null = null;
  stores = toSignal(
    this.storeUseCases.getActiveStores().pipe(
    catchError(err => {
      console.error('Error loading available stores:', err);
      return of([] as Store[]);
    })),
  { initialValue: [] as Store[] }
  );
  
  // Modal to Add/Edit RepairType state
  modalTitle = computed(() => this.isEditing() ? 'Editar Tipo de Compostura' : 'Agregar Tipo de Compostura');
  saveButtonLabel = computed(() => this.isEditing() ? 'Actualizar' : 'Crear');

  // Material relations modal
  materialFormTitle = computed(() => this.isEditingMaterial() ? 'Editar relación de material' : 'Agregar material');
  saveButtonLabelMaterial = computed(() => this.isEditingMaterial() ? 'Actualizar' : 'Agregar');

  constructor(
    private repairTypeUseCases: RepairTypeUseCases,
    private relationUseCases: RepairTypeRelationUseCases,
    private materialUseCases: MaterialUseCases,
    private complexityUseCases: RepairComplexityUseCases,
    private storeUseCases: StoreUseCases
  ) {}

  ngOnInit(): void {
    this.loadRepairTypes();
  }

  loadRepairTypes(): void {
    this.isLoading.set(true);

    const loadMethod = this.selectedStoreFilter 
      ? this.repairTypeUseCases.getAllRepairTypesByStore(this.selectedStoreFilter)
      : this.repairTypeUseCases.getAllRepairTypes();

    loadMethod.subscribe({
      next: (repairTypes) => {this.repairTypes.set(repairTypes);},
      error: (error) => {console.error('Error loading repair types:', error);}});

    this.isLoading.set(false);
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.showModal.set(true);

    this.editingRepairType = {
      name: '',
      code: '',
      estimatedPrice: 0,
      estimatedTime: 0};    
    this.errorMessage = '';
  }

  openEditModal(repairType: RepairType): void {
    this.editingRepairType = { ...repairType };
    this.errorMessage = '';

    this.isEditing.set(true);
    this.showModal.set(true);   
  }

  closeModal(): void {
    this.showModal.set(false);
    
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

    if(this.editingRepairType.repairComplexity && !this.editingRepairType.repairComplexity.id) {
      this.errorMessage = 'Selecciona una complejidad válida';
      
      return;
    }
    
    if (this.isEditing() && this.editingRepairType.id) {
      this.repairTypeUseCases.updateRepairType(this.editingRepairType.id, this.editingRepairType).subscribe({
        next: () => {
          this.loadRepairTypes();
          this.closeModal();},
        error: (error) => {
          console.error('Error updating repair type:', error);
          this.errorMessage = 'Error al actualizar el tipo de compostura';}});
    } else {
      console.log('Creating repair type with data:', this.editingRepairType);
      this.repairTypeUseCases.createRepairType(this.editingRepairType).subscribe({
        next: () => {
          this.loadRepairTypes();
          this.closeModal();},
        error: (error) => {
          console.error('Error creating repair type:', error);
          this.errorMessage = 'Error al crear el tipo de compostura';}});
    }
  }

  toggleStatus(repairType: RepairType): void {
    const action = repairType.isActive 
      ? this.repairTypeUseCases.deactivateRepairType(repairType.id, repairType.store.id) 
      : this.repairTypeUseCases.activateRepairType(repairType.id, repairType.store.id);

    action.subscribe({
      next: () => { this.loadRepairTypes(); },
      error: (error) => { console.error('Error toggling repair type status:', error);}});
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

  onStoreFilterChange(): void {
    this.loadRepairTypes();
  }

  // ── Materials Relations modal ────────────────────────────────────────────────────────

  openRelationsModal(repairType: RepairType): void {
    this.selectedRepairType = repairType;
    this.resetMaterialForm();
    this.loadMaterialRelations();

    this.showRelationsModal.set(true);
  }

  closeRelationsModal(): void {
    this.showRelationsModal.set(false);

    this.selectedRepairType = null;
    this.materialRelations = [];
    this.resetMaterialForm();
  }

  loadMaterialRelations(): void {
    if (!this.selectedRepairType) 
      return;
    
    this.isLoadingMaterials.set(true);
    
    this.relationUseCases.getMaterials(this.selectedRepairType.id).subscribe({
      next: (relations) => { this.materialRelations = relations; },
      error: (error) => { console.error('Error loading material relations:', error); }
    });

    this.isLoadingMaterials.set(false);
  }

  openAddMaterialForm(): void {
    this.isEditingMaterial.set(false);

    this.editingMaterialRelation = { 
      repairTypeId: this.selectedRepairType?.id || '', 
      materialId: '', 
      quantity: 0, 
      unitCost: 0, 
      isOptional: false, 
      sortOrder: 0, 
      storeId: this.selectedRepairType?.store.id || ''};
    this.materialRelationError = '';
    
    this.showMaterialForm.set(true);
  }

  openEditMaterialForm(relation: RepairTypeMaterial): void {
    this.isEditingMaterial.set(true);

    this.editingMaterialRelation = { 
      repairTypeId: this.selectedRepairType?.id || relation.repairTypeId, 
      materialId: relation.materialId, 
      quantity: relation.quantity, 
      unitCost: relation.unitCost, 
      isOptional: relation.isOptional, 
      sortOrder: relation.sortOrder, 
      storeId: relation.storeId };
    this.materialRelationError = '';
    
    this.showMaterialForm.set(true);
  }

  saveMaterialRelation(): void {
    if (!this.selectedRepairType) 
      return;
    
    if (!this.editingMaterialRelation.materialId) 
    { 
      this.materialRelationError = 'Selecciona un material'; 
      
      return; 
    }
    
    if (!this.editingMaterialRelation.quantity || this.editingMaterialRelation.quantity <= 0) 
    { 
      this.materialRelationError = 'La cantidad debe ser mayor a 0'; 
      
      return; 
    }

    if ((this.isEditingMaterial())) {
      this.relationUseCases.updateMaterial(this.editingMaterialRelation as RepairTypeMaterial).subscribe({
        next: () => { 
          this.loadMaterialRelations(); 
          this.resetMaterialForm(); },
        error: (error) => { 
          console.error('Error updating material relation:', error); 
          this.materialRelationError = 'Error al actualizar la relación'; }});
    } else {
      this.relationUseCases.addMaterial(this.editingMaterialRelation as RepairTypeMaterial).subscribe({
        next: () => { 
          this.loadMaterialRelations(); 
          this.resetMaterialForm(); },
        error: (error) => { 
          console.error('Error adding material relation:', error); 
          this.materialRelationError = 'Error al agregar la relación'; }});
    }
  }

  deleteMaterialRelation(relation: RepairTypeMaterial): void {
    if (!this.selectedRepairType) 
      return;
    
    this.deletingMaterialRelation = relation;
    this.showDeleteMaterialModal.set(true);
  }

  confirmDeleteMaterial(): void {
    if (!this.selectedRepairType || !this.deletingMaterialRelation) 
      return;

    this.relationUseCases.removeMaterial(this.deletingMaterialRelation).subscribe({
      next: () => { 
        this.loadMaterialRelations(); 
        this.closeDeleteMaterialModal();
      },
      error: (error) => { 
        console.error('Error removing material relation:', error);
        this.closeDeleteMaterialModal();
      }
    });
  }

  closeDeleteMaterialModal(): void {
    this.showDeleteMaterialModal.set(false);
    this.deletingMaterialRelation = null;
  }

  resetMaterialForm(): void {
    this.showMaterialForm.set(false);
    this.isEditingMaterial.set(false);
    this.editingMaterialRelation = { repairTypeId: this.selectedRepairType?.id || '', materialId: '', quantity: 0, unitCost: 0, isOptional: false, sortOrder: 0, storeId: '' };
    this.materialRelationError = '';
  }

  onMaterialQuantityInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);
    this.editingMaterialRelation.quantity = parseFloat(sanitizedValue) || 0;
  }

  onMaterialUnitCostInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);
    this.editingMaterialRelation.unitCost = parseFloat(sanitizedValue) || 0;
  }

  onComplexityChange(complexityIdOrEvent: string | Event): void {
      const complexityId = typeof complexityIdOrEvent === 'string'
        ? complexityIdOrEvent
        : ((complexityIdOrEvent.target as HTMLSelectElement | null)?.value ?? '');

        this.selectedComplexity = this.availableComplexities().find(complexity => complexity.id === complexityId) || null;

        this.editingRepairType.repairComplexity = this.selectedComplexity
        ? { id: this.selectedComplexity.id, name: this.selectedComplexity.name } as RepairComplexity
        : { id: '', name: '' } as RepairComplexity;
    }
  
  onStoreChange(storeIdOrEvent: string | Event): void {
      const storeId = typeof storeIdOrEvent === 'string'
        ? storeIdOrEvent
        : ((storeIdOrEvent.target as HTMLSelectElement | null)?.value ?? '');

        this.selectedStore = this.stores().find(store => store.id === storeId) || null;

        this.editingRepairType.store = this.selectedStore
        ? { id: this.selectedStore.id, name: this.selectedStore.name } as Store
        : { id: '', name: '' } as Store;
    }

}
