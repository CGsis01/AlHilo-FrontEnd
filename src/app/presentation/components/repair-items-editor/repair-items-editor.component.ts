import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepairItem } from '../../../core/models/repair-item.model';
import { RepairType } from '../../../core/models/repair-type.model';
import { Garment, GarmentRepairType } from '../../../core/models/garment.model';
import { GarmentSelection, GarmentSelectorModalComponent } from '../garment-selector-modal/garment-selector-modal.component';

/** Partial item used while editing inside the form */
export interface RepairItemDraft {
  _id: string; // local draft id
  garment: Garment;
  repairType: GarmentRepairType;
  description: string;
  estimatedPrice: string; // string for input binding, converted on emit
}

@Component({
  selector: 'app-repair-items-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, GarmentSelectorModalComponent],
  templateUrl: './repair-items-editor.component.html',
  styleUrls: ['./repair-items-editor.component.scss']
})

export class RepairItemsEditorComponent implements OnChanges {
  @Input() repairTypes: RepairType[] = [];
  @Input() items: RepairItem[] = [];
  @Input() garments: Garment[] = [];
  @Output() itemsChange = new EventEmitter<RepairItem[]>();

  drafts: RepairItemDraft[] = [];
  showGarmentModal = signal(false);
  private _draftCounter = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.drafts.length === 0) {
      if (this.items.length > 0) {
        this.drafts = this.items.map(item => this.toDraft(item));
      } else {
        this.drafts = [];
        //this.addItem(); // always start with at least one row
      }
    }
  }

  openGarmentModal(): void {
    this.showGarmentModal.set(true);
  }

  closeGarmentModal(): void {
    this.showGarmentModal.set(false);
  }

  onGarmentSelected(selection: GarmentSelection): void {
    this.drafts.push({
      _id: `draft-${++this._draftCounter}`,
      garment: selection.garment,
      repairType: selection.repairType,
      description: '',
      estimatedPrice: selection.repairType.estimatedPriceOverride
        ? selection.repairType.estimatedPriceOverride.toString()
        : ''});

    this.showGarmentModal.set(false);
    
    this.emit();
  }

  addItem(): void {
    this.drafts.push({
      _id: `draft-${++this._draftCounter}`,
      garment: {} as Garment,
      repairType: {} as GarmentRepairType,
      description: '',
      estimatedPrice: ''});
  }

  removeItem(index: number): void {
    this.drafts.splice(index, 1);
    
    this.emit();
  }

  onFieldChange(): void {
    this.emit();
  }

  onPriceInput(event: Event, draft: RepairItemDraft): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    
    if (input.value !== sanitized) input.value = sanitized;
    
    draft.estimatedPrice = sanitized;
    
    this.emit();
  }

  get totalEstimated(): number {
    return this.drafts.reduce((sum, d) => sum + (parseFloat(d.estimatedPrice) || 0), 0);
  }

  get isValid(): boolean {
    return this.drafts.every(d =>
      d.garment.id.trim() &&
      d.repairType.repairTypeId.trim() &&
      d.description.trim() &&
      parseFloat(d.estimatedPrice) > 0);
  }

  private emit(): void {
    const items: RepairItem[] = this.drafts.map(d => {
      const repairType = this.repairTypes.find(rt => rt.id === d.repairType.repairTypeId);

      return {
        id: d._id,
        garment: d.garment,
        repairType: repairType!,
        description: d.description,
        estimatedPrice: parseFloat(d.estimatedPrice) || 0};});

    this.itemsChange.emit(items);
  }

  private toDraft(item: RepairItem): RepairItemDraft {
    return {
      _id: item.id || `draft-${++this._draftCounter}`,
      garment: item.garment,
      repairType: {
        repairTypeId: item.repairType?.id,
        repairTypeName: item.repairType?.name,
        repairTypeCode: item.repairType?.code,
        isDefault: false, // original repair items don't have this info, default to false
        estimatedPriceOverride: item.estimatedPrice
      } as GarmentRepairType, // This cast assumes that the RepairType in the item is compatible with GarmentRepairType
      description: item.description,
      estimatedPrice: item.estimatedPrice?.toString() || ''};
  }
}
