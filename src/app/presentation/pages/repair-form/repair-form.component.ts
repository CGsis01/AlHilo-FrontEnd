import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RepairUseCases } from '../../../domain/usecases/repair.usecases';
import { RepairTypeUseCases } from '../../../domain/usecases/repair-type.usecases';
import { RepairType } from '../../../core/models/repair-type.model';
import { RepairStatusUseCases } from '../../../domain/usecases/repair-status.usecases';
import { RepairStatus } from '../../../core/models/repair-status.model';
import { PaymentTypeUseCases } from '../../../domain/usecases/payment-type.usecases';
import { PaymentType } from '../../../core/models/payment-type.model';
import { PaymentUseCases } from '../../../domain/usecases/payment.usecases';
import { ClientRepository } from '../../../data/repositories/client.repository';
import { Client } from '../../../core/models/client.model';
import { ClientModalComponent } from '../../components/client-modal/client-modal.component';
import { RepairItemsEditorComponent } from '../../components/repair-items-editor/repair-items-editor.component';
import { RepairItem } from '../../../core/models/repair-item.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Repair, RepairStatusEnum } from '@core/models/repair.model';
import { TicketPrintService } from '../../../core/services/ticket-print.service';
import { WhatsappApiService } from '../../../core/services/whatsapp-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DateFormatDirective } from '../../../shared/directives/date-format.directive';

@Component({
  selector: 'app-repair-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClientModalComponent, RepairItemsEditorComponent, DateFormatDirective],
  templateUrl: './repair-form.component.html',
  styleUrls: ['./repair-form.component.scss']
})

export class RepairFormComponent implements OnInit {
  repairForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  isSearching = false;
  showClientModal = false;
  selectedClient: Client | null = null;
  selectedRepairType: RepairType | null = null;
  searchMessage = '';
  
  showTicket = false;
  qrCodeDataUrl = '';
  showAdvancePaymentTicket = false;
  advancePaymentDate: Date = new Date();
  advancePaymentType: 'cash' | 'card' = 'cash';
  advanceCardType: 'debit' | 'credit' = 'debit';
  advanceVoucherId = '';
  advancePaymentAmount = 0;
  pendingAdvancePaymentTicket = false;
  repair: Repair | null = null;
  repairTypes: RepairType[] = [];
  repairStatuses: RepairStatus[] = [];
  paymentTypes: PaymentType[] = [];
  repairItems: RepairItem[] = [];

  constructor(
    private fb: FormBuilder,
    private repairUseCases: RepairUseCases,
    private repairTypeUseCases: RepairTypeUseCases,
    private repairStatusUseCases: RepairStatusUseCases,
    private paymentTypeUseCases: PaymentTypeUseCases,
    private paymentUseCases: PaymentUseCases,
    private router: Router,
    private clientRepository: ClientRepository,
    private ticketPrintService: TicketPrintService,
    private whatsappApiService: WhatsappApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.repairForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      customerEmail: ['', Validators.email],
      customerId: ['', Validators.required],
      advancePayment: ['', [Validators.pattern(/^\d+(\.\d+)?$/), Validators.min(0)]],
      advancePaymentType: ['cash'],
      advanceVoucherId: [''],
      advanceCardType: ['debit'],
      isExpress: [false],
      estimatedDeliveryDate: ['', Validators.required],
      notes: ['']});

    this.repairTypeUseCases.getAllRepairTypes().subscribe({
      next: (repairTypes) => {
        this.repairTypes = repairTypes;},
      error: (error) => {
        console.error('Error fetching repair types:', error);}});

    this.repairStatusUseCases.getAllRepairStatuses().subscribe({
      next: (repairStatuses) => {
        this.repairStatuses = repairStatuses;},
      error: (error) => {
        console.error('Error fetching repair statuses:', error);}});

    this.paymentTypeUseCases.getAllPaymentTypes().subscribe({
      next: (paymentTypes) => {
        this.paymentTypes = paymentTypes;},
      error: (error) => {
        console.error('Error fetching payment types:', error);}});
  
    this.repairForm.get('customerPhone')?.valueChanges
    .pipe(
      debounceTime(500),
      distinctUntilChanged()
    )
    .subscribe(phone => {
      if (phone && phone.length === 10) {
        this.searchClientByPhone(phone);
      } else {
        this.selectedClient = null;
        this.searchMessage = '';
      }});
  }

  searchClientByPhone(phone: string): void {
    this.isSearching = true;
    this.searchMessage = '';
    
    this.clientRepository.searchByPhone(phone).subscribe({
      next: (client) => {
        this.isSearching = false;
        if (client) {
          this.selectedClient = client;
          this.fillClientData(client);
        } else {
          this.selectedClient = null;
          // Auto-open modal when client not found
          setTimeout(() => this.openClientModal(), 300);
        }},
      error: () => {
        this.isSearching = false;
        this.searchMessage = 'Error al buscar cliente';}});
  }

  fillClientData(client: Client): void {
    this.repairForm.patchValue({
      customerId: client.id,
      customerName: client.fullName,
      customerPhone: client.personalPhone,
      customerEmail: client.email || ''});
  }

  clearClientData(): void {
    this.repairForm.patchValue({
      customerName: '',
      customerEmail: ''});
  }

  openClientModal(): void {
    this.showClientModal = true;
  }

  closeClientModal(): void {
    this.showClientModal = false;
  }

  get itemsValid(): boolean {
    return this.repairItems.length > 0 &&
      this.repairItems.every(i =>
        i.garmentType?.trim() && i.repairType && i.description?.trim() && i.estimatedPrice > 0);
  }

  get hasAdvancePayment(): boolean {
    const amount = Number(this.repairForm?.get('advancePayment')?.value);
    
    return Number.isFinite(amount) && amount > 0;
  }

  getAdvanceRemainingBalance(): number {
    const total = this.repair?.estimatedPrice ?? 0;
    const advance = this.advancePaymentAmount > 0
      ? this.advancePaymentAmount
      : (this.repair?.advancePayment ?? 0);
    return Math.max(0, Math.round((total - advance) * 100) / 100);
  }

  onItemsChange(items: RepairItem[]): void {
    this.repairItems = items;
    const totalEstimated = items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    const formattedAdvance = this.formatToTwoDecimals(totalEstimated / 2);
    this.repairForm.get('advancePayment')?.setValue(formattedAdvance, { emitEvent: false });
  }

  onAdvancePaymentInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);
    const formattedAdvance = this.formatToTwoDecimals(sanitizedValue);
    this.repairForm.get('advancePayment')?.setValue(formattedAdvance);
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

  private formatToTwoDecimals(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return '';
    }

    return numericValue.toFixed(2);
  }

  onClientCreated(client: Client): void {
    this.selectedClient = client;
    this.fillClientData(client);
    this.searchMessage = '✓ Cliente creado exitosamente';
    this.showClientModal = false;
  }

  onSubmit(): void {
    const itemsValid = this.repairItems.length > 0 &&
      this.repairItems.every(i => i.garmentType?.trim() && i.repairType && i.description?.trim() && i.estimatedPrice > 0);

    if (this.repairForm.invalid || !this.selectedClient || !itemsValid) {
      if (!itemsValid) this.errorMessage = 'Agrega al menos una prenda con todos sus datos.';
    
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.repairForm.value;
    const rawAdvance = parseFloat(formValue.advancePayment);
    const totalPrice = this.repairItems.reduce((s, i) => s + i.estimatedPrice, 0);
    const selectedAdvancePaymentType = (formValue.advancePaymentType || 'cash') as 'cash' | 'card';
    const advanceVoucherId = (formValue.advanceVoucherId || '').trim();
    const selectedAdvanceCardType = (formValue.advanceCardType || 'debit') as 'debit' | 'credit';

    if (rawAdvance > 0 && selectedAdvancePaymentType === 'card' && !advanceVoucherId) {
      this.errorMessage = 'Ingresa el ID del voucher para registrar el anticipo con tarjeta.';
      this.isLoading = false;
      
      return;
    }

    const repairData = {
      ...formValue,
      customerId: this.selectedClient.id,
      customerName: this.selectedClient.fullName,
      customerPhone: this.selectedClient.personalPhone,
      customerEmail: this.selectedClient.email,
      estimatedPrice: totalPrice,
      repairStatus: this.repairStatuses.find(status => status.name === RepairStatusEnum.PENDING),
      advancePayment: rawAdvance > 0 ? rawAdvance : undefined,
      items: this.repairItems};

    this.repairUseCases.createRepair(repairData).subscribe({
      next: (repair) => {
        if (rawAdvance > 0) {
          const paymentType = this.resolveSelectedAdvancePaymentType(selectedAdvancePaymentType);
          
          if (!paymentType) {
            this.toastService.show('La reparación se creó, pero no se pudo mapear el tipo de pago del anticipo.', 'error');
            this.handleRepairCreated(repair);
            return;
          }

          const paymentData = {
            repair: repair,
            paymentType: paymentType,
            amount: rawAdvance,
            isDebit: selectedAdvancePaymentType === 'card'
              ? selectedAdvanceCardType === 'debit'
              : false,
            voucherId: selectedAdvancePaymentType === 'card' ? advanceVoucherId : undefined,
            isAdvance: true,
            createdBy: repair.createdBy,
            paymentDate: repair.createdAt
          };

          this.paymentUseCases.createPayment(paymentData).subscribe({
            next: () => {
              this.prepareAdvancePaymentTicket(repair, rawAdvance, selectedAdvancePaymentType, selectedAdvanceCardType, advanceVoucherId);
              this.handleRepairCreated(repair);
            },
            error: () => {
              this.toastService.show('La reparación se creó, pero no se pudo registrar el anticipo.', 'error');
              this.handleRepairCreated(repair);
            }
          });

          return;
        }

        this.handleRepairCreated(repair);},
      error: (error) => {
        this.errorMessage = error.message || 'Failed to create repair. Please try again.';
        this.isLoading = false;}});
  }

  private resolveSelectedAdvancePaymentType(paymentType: 'cash' | 'card'): PaymentType | undefined {
    const aliases = paymentType === 'cash'
      ? ['cash', 'efectivo']
      : ['card', 'tarjeta'];

    return this.paymentTypes.find(type => {
      const code = type.code?.toLowerCase() || '';
      const name = type.name?.toLowerCase() || '';
      
      return aliases.some(alias => code.includes(alias) || name.includes(alias));});
  }

  private handleRepairCreated(repair: Repair): void {
    this.repair = repair; 
    this.isLoading = false;

    this.whatsappApiService.sendNotification({
      phone: repair.customerPhone,
      customer_name: repair.customerName,
      repair_id: repair.id.substring(0, 8),
      event: 'received'
    }).subscribe(result => {
      if (result.success) {
        this.toastService.show('Notificación WhatsApp enviada al cliente', 'success');
      } else {
        this.toastService.show('No se pudo enviar la notificación WhatsApp', 'error');
      }
    });
    
    void this.openTicketAndPrint();
  }

  onCancel(): void {
    this.router.navigate(['/repairs']);
  }

  private async openTicketAndPrint(): Promise<void> {
    if (!this.repair) 
      return;
    
    try {
      const ticketData = await this.ticketPrintService.generateTicketData(this.repair);
      
      this.qrCodeDataUrl = ticketData.qrCodeDataUrl;
      this.showTicket = true;

      setTimeout(() => {
        this.triggerWorkOrderPrint();
      }, 100);
    } catch (error) {
      console.error('Error generating ticket:', error);
    }
  }

  closeTicket(): void {
    this.showTicket = false;
    if (this.pendingAdvancePaymentTicket) {
      this.openAdvancePaymentTicket();
    }
  }

  printTicket(): void {
    this.triggerWorkOrderPrint();
  }

  closeAdvancePaymentTicket(): void {
    this.showAdvancePaymentTicket = false;
    this.pendingAdvancePaymentTicket = false;
    this.router.navigate(['/repairs']);
  }

  printAdvancePaymentTicket(): void {
    this.ticketPrintService.simplePrint();
  }

  private openAdvancePaymentTicket(): void {
    this.pendingAdvancePaymentTicket = false;
    this.showAdvancePaymentTicket = true;
  }

  private triggerWorkOrderPrint(): void {
    if (this.pendingAdvancePaymentTicket) {
      this.ticketPrintService.simplePrint();

      setTimeout(() => {
        this.showTicket = false;
        this.openAdvancePaymentTicket();
      }, 100);

      return;
    }

    this.ticketPrintService.printTicket('/repairs');
  }

  private prepareAdvancePaymentTicket(
    repair: Repair,
    amount: number,
    paymentType: 'cash' | 'card',
    cardType: 'debit' | 'credit',
    voucherId: string
  ): void {
    this.advancePaymentAmount = repair.advancePayment ?? amount;
    this.advancePaymentType = paymentType;
    this.advanceCardType = cardType;
    this.advanceVoucherId = voucherId;

    const createdAt = repair.createdAt ? new Date(repair.createdAt) : new Date();
    this.advancePaymentDate = Number.isFinite(createdAt.getTime()) ? createdAt : new Date();

    this.pendingAdvancePaymentTicket = true;
  }
}
