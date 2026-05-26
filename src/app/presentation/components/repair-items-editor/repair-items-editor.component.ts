import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepairItem } from '../../../core/models/repair-item.model';
import { RepairType } from '../../../core/models/repair-type.model';
import { Garment, GarmentRepairType } from '../../../core/models/garment.model';
import { GarmentSelection, GarmentSelectorModalComponent, GarmentTicketData } from '../garment-selector-modal/garment-selector-modal.component';

/** Partial item used while editing inside the form */
export interface RepairItemDraft {
  _id: string; // local draft id
  garment: Garment;
  repairTypes: GarmentRepairType[];
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
  @Input() repairId: string = '';
  @Input() customerName: string = '';
  @Input() customerPhone: string = '';
  @Input() estimatedDeliveryDate: string = '';
  
  @Output() itemsChange = new EventEmitter<RepairItem[]>();
  @Output() printTicketRequest = new EventEmitter<GarmentTicketData>();
  
  private _draftCounter = 0;
  
  showGarmentModal = signal(false);
  drafts: RepairItemDraft[] = [];
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.drafts.length === 0) {
      if (this.items.length > 0) {
        this.drafts = this.items.map(item => this.toDraft(item));
      } else {
        this.drafts = [];
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
    const suggestedPrice = selection.repairTypes.reduce((sum, rt) => sum + (rt.estimatedPriceOverride || 0), 0);
    this.drafts.push({
      _id: `draft-${++this._draftCounter}`,
      garment: selection.garment,
      repairTypes: selection.repairTypes,
      description: selection.comment,
      estimatedPrice: suggestedPrice > 0 ? suggestedPrice.toString() : ''
    });

    this.showGarmentModal.set(false);
    
    this.emit();
  }

  onPrintTicketRequest(data: GarmentTicketData): void {
    this.printTicketRequest.emit(data);
  }

  addItem(): void {
    this.drafts.push({
      _id: `draft-${++this._draftCounter}`,
      garment: {} as Garment,
      repairTypes: [],
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
      d.garment.id?.trim() &&
      d.repairTypes.length > 0 &&
      d.description.trim() &&
      parseFloat(d.estimatedPrice) > 0);
  }

  get canAddService(): boolean {
    return this.customerName.trim().length > 0 
      && this.customerPhone.trim().length > 0
      && this.estimatedDeliveryDate.trim().length > 0;
  }

  private emit(): void {
    const items: RepairItem[] = this.drafts.map(d => {
      const repairTypes = d.repairTypes.map(grt => {
        const found = this.repairTypes.find(rt => rt.id === grt.repairTypeId);
        return found;
      }).filter((rt): rt is RepairType => !!rt);
      return {
        id: d._id,
        garment: d.garment,
        repairTypes,
        description: d.description,
        estimatedPrice: parseFloat(d.estimatedPrice) || 0
      };
    });

    this.itemsChange.emit(items);
  }

  private toDraft(item: RepairItem): RepairItemDraft {
    return {
      _id: item.id || `draft-${++this._draftCounter}`,
      garment: item.garment,
      repairTypes: (item.repairTypes || []).map(rt => ({
        repairTypeId: rt.id,
        repairTypeName: rt.name,
        repairTypeCode: rt.code,
        isDefault: false,
        estimatedPriceOverride: item.estimatedPrice,
        isActive: true
      } as GarmentRepairType)),
      description: item.description,
      estimatedPrice: item.estimatedPrice?.toString() || ''
    };
  }
}
