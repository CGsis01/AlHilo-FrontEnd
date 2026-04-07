import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Garment, GarmentRepairType } from '../../../core/models/garment.model';

export interface GarmentSelection {
  garment: Garment;
  repairType: GarmentRepairType;
}

@Component({
  selector: 'app-garment-selector-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './garment-selector-modal.component.html',
  styleUrls: ['./garment-selector-modal.component.scss']
})

export class GarmentSelectorModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() garments: Garment[] = [];
  @Output() garmentSelected = new EventEmitter<GarmentSelection>();
  @Output() closed = new EventEmitter<void>();

  step: 'garments' | 'repairTypes' = 'garments';
  searchQuery = '';
  filtered: Garment[] = [];
  selectedGarment: Garment | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['garments'] || changes['isOpen']) {
      this.reset();
    }
  }

  applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filtered = q
      ? this.garments.filter(g => g.name.toLowerCase().includes(q))
      : [...this.garments];
  }

  selectGarment(garment: Garment): void {
    this.selectedGarment = garment;
    this.step = 'repairTypes';
  }

  selectRepairType(repairType: GarmentRepairType): void {
    this.garmentSelected.emit({ garment: this.selectedGarment!, repairType });
    this.reset();
    this.closed.emit();
  }

  back(): void {
    this.step = 'garments';
    this.selectedGarment = null;
  }

  close(): void {
    this.reset();
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  private reset(): void {
    this.step = 'garments';
    this.searchQuery = '';
    this.selectedGarment = null;
    this.applyFilter();
  }
}

