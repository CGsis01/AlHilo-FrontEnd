import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserUseCases } from '../../../domain/usecases/user.usecases';
import { RepairUseCases } from '../../../domain/usecases/repair.usecases';
import { RepairStatusUseCases } from '../../../domain/usecases/repair-status.usecases';
import { Repair, RepairStatusEnum } from '../../../core/models/repair.model';
import { RepairStatus } from '@core/models/repair-status.model';
import { PaymentTypeUseCases } from '@domain/usecases/payment-type.usecases';
import { PaymentType } from '@core/models/payment-type.model';
import { PaymentUseCases } from '../../../domain/usecases/payment.usecases';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole, UserRoleCode } from '../../../core/models/user.model';
import { TicketPrintService } from '../../../core/services/ticket-print.service';
import { WhatsappApiService } from '../../../core/services/whatsapp-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-repair-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './repair-detail.component.html',
  styleUrls: ['./repair-detail.component.scss', './repair-detail.receipt.scss']
})

export class RepairDetailComponent implements OnInit {
  repair: Repair | null = null;
  isLoading = true;
  errorMessage = '';
  userRole: UserRole | undefined;
  UserRole = UserRoleCode;
  RepairStatus = RepairStatusEnum;
  repairStatuses: RepairStatus[] = [];
  paymentTypes: PaymentType[] = [];

  showAssignModal = false;
  seamstresses: User[] = [];
  selectedSeamstress: User | null = null;
  isLoadingSeamstresses = false;

  showTicket = false;
  qrCodeDataUrl = '';

  showPaymentModal = false;
  paymentType: 'cash' | 'card' | 'mixed' = 'cash';
  cardType: 'debit' | 'credit' = 'debit';
  voucherId = '';
  cashAmount: string | null = null;
  mixedCashAmount: string | null = null;
  mixedCardAmount: string | null = null;

  showPaymentTicket = false;
  paymentDate: Date = new Date();
  paidPaymentType: 'cash' | 'card' | 'mixed' = 'cash';
  paidCardType: 'debit' | 'credit' = 'debit';
  paidCashAmount: string | null = null;
  paidMixedCashAmount: string | null = null;
  paidMixedCardAmount: string | null = null;
  paidVoucherId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repairUseCases: RepairUseCases,
    private repairStatusUseCases: RepairStatusUseCases,
    private paymentTypeUseCases: PaymentTypeUseCases,
    private paymentUseCases: PaymentUseCases,
    private userUseCases: UserUseCases,
    private authService: AuthService,
    private ticketPrintService: TicketPrintService,
    private whatsappApiService: WhatsappApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.currentUser?.role;
    
    const repairId = this.route.snapshot.paramMap.get('id');
    
    if (repairId) {
      this.loadRepair(repairId);
      this.loadRepairStatuses();
      this.loadPaymentTypes();
    } else {
      this.router.navigate(['/repairs']);
    }
  }

  loadRepair(id: string): void {
    this.isLoading = true;
    
    this.repairUseCases.getRepairById(id).subscribe({
      next: (repair) => {
        this.repair = repair;
        this.isLoading = false;},
      error: (error) => {
        this.errorMessage = error.message || 'Error al cargar la reparación';
        this.isLoading = false;}});
  }

  loadRepairStatuses(): void {
    this.repairStatusUseCases.getAllRepairStatuses().subscribe({
      next: (statuses) => {
        this.repairStatuses = statuses;},
      error: () => {
        this.repairStatuses = [];}});
  }

  loadPaymentTypes(): void {
    this.paymentTypeUseCases.getAllPaymentTypes().subscribe({
      next: (types) => {
        this.paymentTypes = types;},
      error: () => {
        this.paymentTypes = [];}});
  }

  getStatusClass(status: string): string {
    const statusMap: Record<RepairStatusEnum, string> = {
      [RepairStatusEnum.PENDING]: 'status-pending',
      [RepairStatusEnum.IN_PROGRESS]: 'status-in-progress',
      [RepairStatusEnum.IN_VALIDATION]: 'status-in-validation',
      [RepairStatusEnum.VALIDATED]: 'status-validated',
      [RepairStatusEnum.DELIVERED]: 'status-delivered'};
    
    return statusMap[status as RepairStatusEnum];
  }

  getRepairStatus(statusName: string): RepairStatus {
    return this.repairStatuses.filter(status => status.name === statusName)[0]!;
  }

  updateStatus(newStatus: RepairStatus): void {
    if (!this.repair) 
      return;
    
    this.repairUseCases.updateRepairStatus(this.repair.id, newStatus).subscribe({
      next: (updatedRepair) => {
        this.repair = updatedRepair;
        
        if (updatedRepair.repairStatus.name === RepairStatusEnum.VALIDATED) {
          this.whatsappApiService.sendNotification({
            phone: updatedRepair.customerPhone,
            customer_name: updatedRepair.customerName,
            repair_id: updatedRepair.id.substring(0, 8), // Shorten ID for message
            event: 'validated'
          }).subscribe(result => {
            if (result.success) {
              this.toastService.show('Notificación WhatsApp enviada: reparación lista', 'success');
            } else {
              this.toastService.show('No se pudo enviar la notificación WhatsApp', 'error');
            }});}},
      error: (error) => {
        this.errorMessage = error.message || 'Error al actualizar el estado';}});
  }

  openAssignModal(): void {
    this.showAssignModal = true;
    this.selectedSeamstress = this.repair?.assignedTo || null;
    
    this.loadSeamstresses();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedSeamstress = null;
  }

  loadSeamstresses(): void {
    this.isLoadingSeamstresses = true;
    this.userUseCases.getUsersByRole([{ code: UserRoleCode.SEAMSTRESS }, { code: UserRoleCode.HEADSEWING }] as UserRole[]).subscribe({
      next: (users) => {
        this.seamstresses = users.filter(u => u.isActive);
        this.isLoadingSeamstresses = false;},
      error: () => {
        this.isLoadingSeamstresses = false;}});
  }

  selectSeamstress(seamstress: User): void {
    this.selectedSeamstress = seamstress;
  }

  async confirmAssignment(): Promise<void> {
    if (!this.repair || !this.selectedSeamstress) 
      return;

    this.repairUseCases.assignRepairToSeamstress(this.repair.id, this.selectedSeamstress)
    .subscribe({
      next: async (updatedRepair) => {
        this.repair = updatedRepair;
        this.updateStatus(this.repairStatuses.filter(s => s.name === RepairStatusEnum.IN_PROGRESS)[0]);
        
        this.whatsappApiService.sendNotification({
          phone: updatedRepair.customerPhone,
          customer_name: updatedRepair.customerName,
          repair_id: updatedRepair.id.substring(0, 8), // Shorten ID for message
          event: 'in_progress'
        }).subscribe(result => {
          if (result.success) {
            this.toastService.show('Notificación WhatsApp enviada: reparación en progreso', 'success');
          } else {
            this.toastService.show('No se pudo enviar la notificación WhatsApp', 'error');
          }
        });
        this.closeAssignModal();},
      error: (error) => {
        this.errorMessage = error.message || 'Error al asignar la costurera';}});
  }

  openPaymentModal(): void {
    this.paymentType = 'cash';
    this.cardType = 'debit';
    this.voucherId = '';
    this.cashAmount = null;
    this.mixedCashAmount = null;
    this.mixedCardAmount = null;
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.cardType = 'debit';
    this.voucherId = '';
    this.cashAmount = null;
    this.mixedCashAmount = null;
    this.mixedCardAmount = null;
  }

  confirmPayment(): void {
    if (!this.repair) 
      return;

    const deliveredStatus = this.getRepairStatus(RepairStatusEnum.DELIVERED);
    
    this.repairUseCases.updateRepairStatus(this.repair.id, deliveredStatus).subscribe({
      next: (updatedRepair) => {
        const remaining = this.getRemainingBalance();
        const cashPaid = this.getNumericAmount(this.cashAmount);
        const mixedCashPaid = this.getNumericAmount(this.mixedCashAmount);
        const mixedCardPaid = this.getNumericAmount(this.mixedCardAmount);
        const mixedTotal = this.roundToTwo(mixedCashPaid + mixedCardPaid);

        this.paidPaymentType = this.paymentType;
        this.paidCardType = this.cardType;
        this.paidVoucherId = this.voucherId;
        this.paidCashAmount = this.cashAmount;
        this.paidMixedCashAmount = this.mixedCashAmount;
        this.paidMixedCardAmount = this.mixedCardAmount;
        this.paymentDate = new Date();

        if (this.paymentType === 'mixed') {
          if (mixedTotal < remaining) {
            this.toastService.show('El pago mixto debe cubrir el saldo restante.', 'error');
            this.handleRepairUpdated(updatedRepair);
            return;
          }

          if (mixedTotal > remaining) {
            this.toastService.show('El pago mixto no puede ser mayor al saldo restante.', 'error');
            this.handleRepairUpdated(updatedRepair);
            return;
          }

          if (mixedCardPaid > remaining) {
            this.toastService.show('El pago con tarjeta no puede ser mayor al saldo restante.', 'error');
            this.handleRepairUpdated(updatedRepair);
            return;
          }

          if (mixedCardPaid > 0 && !this.voucherId.trim()) {
            this.toastService.show('Ingresa el ID del voucher para registrar el pago con tarjeta.', 'error');
            this.handleRepairUpdated(updatedRepair);
            return;
          }
        }

        const cashPaymentAmount = this.paymentType === 'mixed'
          ? mixedCashPaid
          : this.paymentType === 'cash'
            ? (cashPaid > 0 ? cashPaid : remaining)
            : 0;
        const cardPaymentAmount = this.paymentType === 'mixed'
          ? mixedCardPaid
          : this.paymentType === 'card'
            ? remaining
            : 0;
        const needsCash = cashPaymentAmount > 0;
        const needsCard = cardPaymentAmount > 0;
        const paymentTypeCash = needsCash ? this.resolveSelectedAdvancePaymentType('cash') : undefined;
        const paymentTypeCard = needsCard ? this.resolveSelectedAdvancePaymentType('card') : undefined;

        if ((needsCash && !paymentTypeCash) || (needsCard && !paymentTypeCard)) {
          if (needsCash && !paymentTypeCash && needsCard && !paymentTypeCard) {
            this.toastService.show('La reparación se actualizó, pero no se pudieron mapear los tipos de pago de la reparación.', 'error');
          } else if (needsCash && !paymentTypeCash) {
            this.toastService.show('La reparación se actualizó, pero no se pudo mapear el tipo de pago en efectivo.', 'error');
          } else {
            this.toastService.show('La reparación se actualizó, pero no se pudo mapear el tipo de pago con tarjeta.', 'error');
          }
          
          this.handleRepairUpdated(updatedRepair);
          
          return;
        }

        const paymentRequests = [];

        if (needsCash && paymentTypeCash) {
          paymentRequests.push(this.paymentUseCases.createPayment({
            repair: updatedRepair,
            paymentType: paymentTypeCash,
            amount: cashPaymentAmount,
            isDebit: false,
            isAdvance: false,
            createdBy: this.authService.currentUser!,
            paymentDate: new Date()
          }));
        }

        if (needsCard && paymentTypeCard) {
          paymentRequests.push(this.paymentUseCases.createPayment({
            repair: updatedRepair,
            paymentType: paymentTypeCard,
            amount: cardPaymentAmount,
            isDebit: this.paidCardType === 'debit',
            voucherId: this.voucherId || undefined,
            isAdvance: false,
            createdBy: this.authService.currentUser!,
            paymentDate: new Date()
          }));
        }

        if (paymentRequests.length === 0) {
          this.handleRepairUpdated(updatedRepair);
          this.closePaymentModal();
          this.showPaymentTicket = true;
          
          return;
        }

        forkJoin(paymentRequests).subscribe({
          next: () => { this.handleRepairUpdated(updatedRepair); },
          error: () => {
            this.toastService.show('La reparación se actualizó, pero no se pudo registrar el pago.', 'error');
            this.handleRepairUpdated(updatedRepair);}});        

        this.closePaymentModal();

        this.showPaymentTicket = true;
        
        this.printPaymentTicket();
        this.closePaymentTicket();
        this.goBack();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al actualizar el estado';}});
  }

  onPaymentTypeChange(selectedType: 'cash' | 'card' | 'mixed'): void {
    if (selectedType === 'card') {
      this.cashAmount = null;
      this.mixedCashAmount = null;
      this.mixedCardAmount = null;
      return;
    }

    if (selectedType === 'cash') {
      this.mixedCashAmount = null;
      this.mixedCardAmount = null;
      return;
    }

    this.cashAmount = null;
  }

  isEnabledConfirmPayment(): boolean {
    const remaining = this.getRemainingBalance();

    if (this.paymentType === 'cash') {
      const cashPaid = this.getNumericAmount(this.cashAmount);
      return !this.cashAmount?.trim() || cashPaid < remaining;
    }

    if (this.paymentType === 'card') {
      return !this.voucherId.trim();
    }

    const mixedCash = this.getNumericAmount(this.mixedCashAmount);
    const mixedCard = this.getNumericAmount(this.mixedCardAmount);
    const mixedTotal = this.roundToTwo(mixedCash + mixedCard);

    if (mixedCard > remaining) {
      return true;
    }

    if (mixedTotal < remaining) {
      return true;
    }

    if (mixedTotal > remaining) {
      return true;
    }

    if (mixedCard > 0 && !this.voucherId.trim()) {
      return true;
    }

    return false;
  }

  get hasMixedCardPayment(): boolean {
    return this.paymentType === 'mixed' && this.getNumericAmount(this.mixedCardAmount) > 0;
  }

  get hasPaidMixedCardPayment(): boolean {
    return this.paidPaymentType === 'mixed' && this.getNumericAmount(this.paidMixedCardAmount) > 0;
  }

  closePaymentTicket(): void {
    this.showPaymentTicket = false;
  }

  printPaymentTicket(): void {
    this.ticketPrintService.simplePrint();
  }

  async generateTicket(): Promise<void> {
    if (!this.repair) 
      return;

    try {
      // Use the ticket print service to generate ticket data
      const ticketData = await this.ticketPrintService.generateTicketData(this.repair);
      this.qrCodeDataUrl = ticketData.qrCodeDataUrl;
      this.showTicket = true;

      // Wait for the modal to render before printing
      setTimeout(() => {
        this.ticketPrintService.simplePrint();
        this.closeTicket();
      }, 100);      
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  closeTicket(): void {
    this.showTicket = false;
  }

  printTicket(): void {
    // Use simple print for re-printing (no redirect)
    this.ticketPrintService.simplePrint();
  }

  goBack(): void {
    this.router.navigate(['/repairs']);
  }

  onCashAmountInput(event: Event): void {
    this.cashAmount = this.sanitizeDecimalInput(event);
  }

  onMixedCashAmountInput(event: Event): void {
    this.mixedCashAmount = this.sanitizeDecimalInput(event);
  }

  onMixedCardAmountInput(event: Event): void {
    this.mixedCardAmount = this.sanitizeDecimalInput(event);
  }

  getRemainingBalance(): number {
    const total = this.repair?.finalPrice ?? this.repair?.estimatedPrice ?? 0;
    const advance = this.repair?.advancePayment ?? 0;
    return Math.round((total - advance) * 100) / 100;
  }

  getPaidChange(): number {
    const remaining = this.getRemainingBalance();

    if (this.paidPaymentType === 'mixed') {
      const cashPaid = this.getNumericAmount(this.paidMixedCashAmount);
      const cardPaid = this.getNumericAmount(this.paidMixedCardAmount);
      const change = cashPaid - Math.max(0, remaining - cardPaid);
      return this.roundToTwo(Math.max(0, change));
    }

    if (this.paidPaymentType === 'cash') {
      const paid = this.getNumericAmount(this.paidCashAmount);
      return this.roundToTwo(paid - remaining);
    }

    return 0;
  }

  private sanitizeDecimalInput(event: Event): string {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1');

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    return sanitizedValue;
  }

  private getNumericAmount(value: string | null | undefined): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private roundToTwo(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private resolveSelectedAdvancePaymentType(paymentType: 'cash' | 'card'): PaymentType | undefined {
    const aliases = paymentType === 'cash'
      ? ['cash', 'efectivo']
      : ['card', 'tarjeta'];

    return this.paymentTypes.find(type => {
      const code = type.code?.toLowerCase() || '';
      const name = type.name?.toLowerCase() || '';
      
      return aliases.some(alias => code.includes(alias) || name.includes(alias));
    });
  }

  private handleRepairUpdated(repair: Repair): void {
    this.repair = repair; // Store the created repair for ticket generation
    this.isLoading = false;
  }
}
