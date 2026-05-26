import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Garment, GarmentRepairType } from '../../../core/models/garment.model';
import * as QRCode from 'qrcode';

export interface GarmentSelection {
  garment: Garment;
  repairType: GarmentRepairType;
  comment: string;
}

export interface GarmentTicketData {
  qrCodeDataUrl: string;
  garmentName: string;
  repairTypeName: string;
  comment: string;
  repairId: string;
  customerName?: string;
  receivedDate?: Date;
  estimatedDeliveryDate?: Date;
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
  @Input() repairId: string = '';
  @Input() customerName: string = '';
  @Input() estimatedDeliveryDate: string = '';

  @Output() garmentSelected = new EventEmitter<GarmentSelection>();
  @Output() closed = new EventEmitter<void>();
  @Output() printTicketRequest = new EventEmitter<GarmentTicketData>();

  step: 'garments' | 'repairTypes' | 'comments' = 'garments';
  searchQuery = '';
  filtered: Garment[] = [];
  repairTypeSearchQuery = '';
  filteredRepairTypes: GarmentRepairType[] = [];
  selectedGarment: Garment | null = null;

  commentAddService = '';
  showModalAddServices = signal(false);
  selectedRepairType: GarmentRepairType | null = null;

  openGarmentModal(): void {
    this.showModalAddServices.set(true);
  }

  closeGarmentModal(): void {
    this.showModalAddServices.set(false);
  }

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
    this.repairTypeSearchQuery = '';
    this.applyRepairTypeFilter();
    this.step = 'repairTypes';
  }

  applyRepairTypeFilter(): void {
    const repairTypes = this.selectedGarment?.repairTypes ?? [];
    const q = this.normalizeForSearch(this.repairTypeSearchQuery);

    this.filteredRepairTypes = q
      ? repairTypes.filter(rt => {
          const name = this.normalizeForSearch(rt.repairTypeName);
          const code = this.normalizeForSearch(rt.repairTypeCode);
          return name.includes(q) || code.includes(q);
        })
      : [...repairTypes];
  }

  private normalizeForSearch(value?: string | null): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  selectRepairType(repairType: GarmentRepairType): void {
    this.selectedRepairType = repairType;
    this.showModalAddServices.set(true);
  }

  async confirmSelection(): Promise<void> {
    if (!this.selectedGarment || !this.selectedRepairType) return;

    let qrCodeDataUrl = '';
    
    try {
      qrCodeDataUrl = await QRCode.toDataURL(this.repairId, { width: 150, margin: 2});
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    this.printTicketRequest.emit({
      qrCodeDataUrl,
      garmentName: this.selectedGarment.name,
      repairTypeName: this.selectedRepairType.repairTypeName,
      comment: this.commentAddService,
      repairId: this.repairId,
      customerName: this.customerName,
      receivedDate: new Date(),
      estimatedDeliveryDate: this.estimatedDeliveryDate ? new Date(this.estimatedDeliveryDate) : undefined
    });

    this.garmentSelected.emit({ garment: this.selectedGarment, repairType: this.selectedRepairType, comment: this.commentAddService });
    
    this.showModalAddServices.set(false);
    
    this.reset();
    this.closed.emit();
  }
  
  back(): void {
    this.step = 'garments';
    this.repairTypeSearchQuery = '';
    this.filteredRepairTypes = [];
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
    this.repairTypeSearchQuery = '';
    this.filteredRepairTypes = [];
    this.selectedGarment = null;
    this.selectedRepairType = null;
    this.commentAddService = "";
    this.applyFilter();
  }
}

