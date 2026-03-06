import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RepairItem } from '../../../core/models/repair-item.model';
import { RepairType } from '../../../core/models/repair-type.model';

/** Partial item used while editing inside the form */
export interface RepairItemDraft {
  _id: string; // local draft id
  garmentType: string;
  repairTypeId: string;
  description: string;
  estimatedPrice: string; // string for input binding, converted on emit
}

@Component({
  selector: 'app-repair-items-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './repair-items-editor.component.html',
  styleUrls: ['./repair-items-editor.component.scss']
})

export class RepairItemsEditorComponent implements OnChanges {
  @Input() repairTypes: RepairType[] = [];
  @Input() items: RepairItem[] = [];
  @Output() itemsChange = new EventEmitter<RepairItem[]>();

  drafts: RepairItemDraft[] = [];
  private _draftCounter = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.drafts.length === 0) {
      if (this.items.length > 0) {
        this.drafts = this.items.map(item => this.toDraft(item));
      } else {
        this.addItem(); // always start with at least one row
      }
    }
  }

  addItem(): void {
    this.drafts.push({
      _id: `draft-${++this._draftCounter}`,
      garmentType: '',
      repairTypeId: '',
      description: '',
      estimatedPrice: ''});
  }

  removeItem(index: number): void {
    if (this.drafts.length <= 1) return; // at least one item required
    
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
      d.garmentType.trim() &&
      d.repairTypeId &&
      d.description.trim() &&
      parseFloat(d.estimatedPrice) > 0);
  }

  private emit(): void {
    const items: RepairItem[] = this.drafts.map(d => {
      const repairType = this.repairTypes.find(rt => rt.id === d.repairTypeId);

      return {
        id: d._id,
        garmentType: d.garmentType,
        repairType: repairType!,
        description: d.description,
        estimatedPrice: parseFloat(d.estimatedPrice) || 0};});

    this.itemsChange.emit(items);
  }

  private toDraft(item: RepairItem): RepairItemDraft {
    return {
      _id: item.id || `draft-${++this._draftCounter}`,
      garmentType: item.garmentType,
      repairTypeId: item.repairType?.id || '',
      description: item.description,
      estimatedPrice: item.estimatedPrice?.toString() || ''};
  }
}
