import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { register as registerSwiperElements } from 'swiper/element/bundle';
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
import { repairImpressionTicket } from '../../../shared/utils/repairImpressionTicket.utils';
import { WhatsappApiService } from '../../../core/services/whatsapp-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';
import { RepairComment } from '@core/models/repair-comment.model';
import { getStoredUserId } from '../../../shared/utils/userLocalData.utils';
import { RepairItem } from '@core/models/repair-item.model';

@Component({
  selector: 'app-repair-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './repair-detail.component.html',
  styleUrls: ['./repair-detail.component.scss', './repair-detail.receipt.scss']
})

export class RepairDetailComponent implements OnInit {
  // ─── Repair ───────────────────────────────────────────────────
  isLoading = signal(true);
  errorMessage = '';

   // ─── Advance Ticket ──────────────────────────────────────────
  advancePaymentMinimum = 0;
  advancePaymentMaximum = 0;

  repair: Repair | null = null;
  userRole: UserRole | undefined;
  UserRole = UserRoleCode;
  RepairStatus = RepairStatusEnum;
  repairComment: RepairComment[] = [];
  showAssignModalJobReview = signal(false);
  comment: string = '';

  // ─── Seamstresses ─────────────────────────────────────────────
  showAssignModal = signal(false);
  isLoadingSeamstresses = signal(false);
  seamstresses: User[] = [];
  selectedSeamstress: User | null = null;  

  // ─── Repair Ticket ────────────────────────────────────────────
  showTicket = signal(false);
  activeTicketItem: RepairItem | null = null;
  activeTicketIndex = 0;
  qrCodeDataUrl = '';

 // ─── Advance Ticket ───────────────────────────────────────────
  showAdvancePaymentTicket = signal(false);
  pendingAdvancePaymentTicket = signal(false);


  // ─── Repair Items ─────────────────────────────────────────────
  repairItems: RepairItem[] = [];
  repairForm!: FormGroup;

  // ─── Payment Modal ────────────────────────────────────────────
  showPaymentModal = signal(false);
  paymentType: 'cash' | 'card' | 'mixed' = 'cash';
  cardType: 'debit' | 'credit' = 'debit';
  voucherId = '';
  cashAmount: string | null = null;
  mixedCashAmount: string | null = null;
  mixedCardAmount: string | null = null;

  // ─── Payment Ticket ───────────────────────────────────────────
  showPaymentTicket = signal(false);
  paymentDate: Date = new Date();
  paidPaymentType: 'cash' | 'card' | 'mixed' = 'cash';
  paidCardType: 'debit' | 'credit' = 'debit';
  paidCashAmount: string | null = null;
  paidMixedCashAmount: string | null = null;
  paidMixedCardAmount: string | null = null;
  paidVoucherId = '';

  repairStatuses = toSignal(
    this.repairStatusUseCases.getAllRepairStatuses().pipe(
      catchError(err => {
        console.error('Error loading stores:', err);
        return of([] as RepairStatus[]);
      })
    ),
    { initialValue: [] as RepairStatus[] }
  );

  paymentTypes = toSignal(
    this.paymentTypeUseCases.getAllPaymentTypes().pipe(
      catchError(err => {
        console.error('Error loading payment types:', err);
        return of([] as PaymentType[]);
      })
    ),
    { initialValue: [] as PaymentType[] }
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repairUseCases: RepairUseCases,
    private repairStatusUseCases: RepairStatusUseCases,
    private paymentTypeUseCases: PaymentTypeUseCases,
    private paymentUseCases: PaymentUseCases,
    private userUseCases: UserUseCases,
    private authService: AuthService,
    private repairImpressionTicket: repairImpressionTicket,
    private whatsappApiService: WhatsappApiService,
    private toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.userRole = this.authService.currentUser?.role;
    
    const repairId = this.route.snapshot.paramMap.get('id');
    
    if (repairId) {
      this.loadRepair(repairId);
    } else {
      this.router.navigate(['/repairs']);
    }

    await this.ensureSwiper();
  }

  // ─── Repair ───────────────────────────────────────────────────
  private async ensureSwiper(): Promise<void> {
    if (typeof customElements === 'undefined') return;
    if (customElements.get('swiper-container')) return;
    registerSwiperElements();
  }

  loadRepair(id: string): void {
    this.isLoading.set(true);
    
    this.repairUseCases.getRepairById(id).subscribe({
      next: (repair) => { this.repair = repair; },
      error: (error) => { this.errorMessage = error.message || 'Error al cargar la reparación'; }});

    this.repairUseCases.getComments(id).subscribe({
      next: (comments) => { this.repairComment = Array.isArray(comments) ? comments : []; },
      error: () => { this.repairComment = []; }});
    
    this.isLoading.set(false);
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
    return this.repairStatuses().filter(status => status.name === statusName)[0]!;
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

  // ─── Seamstresses ─────────────────────────────────────────────
  openAssignModal(): void {
    this.selectedSeamstress = this.repair?.assignedTo || null;    
    this.loadSeamstresses();

    this.showAssignModal.set(true);
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
    
    this.selectedSeamstress = null;
  }
  // ─── Job Reviews ─────────────────────────────────────────────
  openAssignModalJobReview(): void {
        this.showAssignModalJobReview.set(true);
    }

    closeAssignModalJobReview(): void {
        this.showAssignModalJobReview.set(false);
    }

  loadSeamstresses(): void {
    this.isLoadingSeamstresses.set(true);
    
    this.userUseCases.getUsersByRole([{ code: UserRoleCode.SEAMSTRESS }, { code: UserRoleCode.HEADSEWING }] as UserRole[]).subscribe({
      next: (users) => { this.seamstresses = users.filter(u => u.isActive); },
      error: () => { }});
    
    this.isLoadingSeamstresses.set(false);
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
        this.updateStatus(this.repairStatuses().filter(s => s.name === RepairStatusEnum.IN_PROGRESS)[0]);
        
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
      error: (error) => { this.errorMessage = error.message || 'Error al asignar la costurera';}});
  }

  async confirmJobReview(): Promise<void> {
    if (!this.comment.trim() || !this.repair) return;

    const currentUserId = getStoredUserId() ?? '';

    this.repairUseCases.addComment(
      this.repair.id,
      this.comment.trim(),
      currentUserId,
    ).subscribe({
      next: (savedComment) => {
        console.log(savedComment, "EL valor del c", this.comment);
        this.repairComment = [savedComment, ...(Array.isArray(this.repairComment) ? this.repairComment : [])];
        console.log(this.repairComment, "el repairComment")
        this.comment = '';
        this.updateStatus(this.repairStatuses().filter(s => s.name === RepairStatusEnum.IN_PROGRESS)[0]);
        this.toastService.show('Comentario agregado exitosamente', 'success');
        this.closeAssignModalJobReview();
      },
      error: (error) => {
        this.toastService.show('Error al agregar el comentario: ' + error.message, 'error');
      }
    });
  }

  // ─── Repair Ticket ────────────────────────────────────────────
  async generateTicket(): Promise<void> {
    if (!this.repair) 
      return;

    try {
      const ticketData = await this.repairImpressionTicket.generateTicketData(this.repair);
      this.qrCodeDataUrl = ticketData.qrCodeDataUrl;

      await this.triggerWorkOrderPrint();
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  closeTicket(): void {
    this.showTicket.set(false);
    this.activeTicketItem = null;
    this.activeTicketIndex = 0;
    if (this.pendingAdvancePaymentTicket()) {
      this.openAdvancePaymentTicket();
    }
  }
  // ─── Payment Modal ────────────────────────────────────────────
  openPaymentModal(): void {
    this.initializePaymentModal();
    
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);

    this.initializePaymentModal();
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
            paymentDate: new Date() }));
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
            paymentDate: new Date() }));
        }

        if (paymentRequests.length === 0) {
          this.handleRepairUpdated(updatedRepair);
          this.closePaymentModal();
          
          this.showPaymentTicket.set(true);
          
          return;
        }

        forkJoin(paymentRequests).subscribe({
          next: () => { this.handleRepairUpdated(updatedRepair); },
          error: () => {
            this.toastService.show('La reparación se actualizó, pero no se pudo registrar el pago.', 'error');
            this.handleRepairUpdated(updatedRepair);}});        

        this.closePaymentModal();

        this.showPaymentTicket.set(true);

        setTimeout(() => {
          this.printPaymentTicket();
          this.closePaymentTicket();
          this.goBack();
        }, 100);
      },
      error: (error) => { this.errorMessage = error.message || 'Error al actualizar el estado';}});
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

  // ─── Payment Ticket ───────────────────────────────────────────
  closePaymentTicket(): void {
    this.showPaymentTicket.set(false);
  }

  printPaymentTicket(): void {
    this.repairImpressionTicket.simplePrint();
  }

  goBack(): void {
    this.router.navigate(['/repairs']);
  }

  // ─── Helpers ──────────────────────────────────────────────────
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

  private formatToTwoDecimals(value: number): string {
    return value.toFixed(2);
  }


  private getAdvanceNumericValue(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private getMixedAdvanceTotal(): number {
    const cash = this.getAdvanceNumericValue(this.repairForm?.get('advancePaymentCash')?.value);
    const card = this.getAdvanceNumericValue(this.repairForm?.get('advancePaymentCard')?.value);
    return Math.round((cash + card) * 100) / 100;
  }

  private updateMixedAdvanceTotal(): void {
    const total = this.getMixedAdvanceTotal();
    const formattedTotal = this.formatToTwoDecimals(total);
    this.repairForm.get('advancePayment')?.setValue(formattedTotal, { emitEvent: false });
    this.repairForm.get('advancePayment')?.updateValueAndValidity({ emitEvent: false });
  }

  private calculateAdvancePaymentMinimum(items: RepairItem[] = this.repairItems): number {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
    return totalEstimated > 0 ? Math.round((totalEstimated / 2) * 100) / 100 : 0;
  }

  private calculateAdvancePaymentMaximum(items: RepairItem[] = this.repairItems): number {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
    return totalEstimated > 0 ? Math.round(totalEstimated * 100) / 100 : 0;
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

    return this.paymentTypes().find(type => {
      const code = type.code?.toLowerCase() || '';
      const name = type.name?.toLowerCase() || '';
      
      return aliases.some(alias => code.includes(alias) || name.includes(alias));
    });
  }

  private handleRepairUpdated(repair: Repair): void {
    this.repair = repair; // Store the created repair for ticket generation
    this.isLoading.set(false);
  }

  get hasMixedCardPayment(): boolean {
    return this.paymentType === 'mixed' && this.getNumericAmount(this.mixedCardAmount) > 0;
  }

  get hasPaidMixedCardPayment(): boolean {
    return this.paidPaymentType === 'mixed' && this.getNumericAmount(this.paidMixedCardAmount) > 0;
  }

  private initializePaymentModal(): void {
    this.paymentType = 'cash';
    this.cardType = 'debit';
    this.voucherId = '';
    this.cashAmount = null;
    this.mixedCashAmount = null;
    this.mixedCardAmount = null;
  }

  onItemsChange(items: RepairItem[]): void {
    this.repairItems = items;
    this.advancePaymentMinimum = this.calculateAdvancePaymentMinimum(items);
    this.advancePaymentMaximum = this.calculateAdvancePaymentMaximum(items);
    
    const formattedAdvance = this.formatToTwoDecimals(this.advancePaymentMinimum);
    const paymentType = this.repairForm.get('advancePaymentType')?.value as 'cash' | 'card' | 'mixed';

    if (paymentType === 'mixed') {
      this.repairForm.patchValue({
        advancePaymentCash: formattedAdvance,
        advancePaymentCard: this.formatToTwoDecimals(0)
      }, { emitEvent: false });
      this.updateMixedAdvanceTotal();
    } else {
      this.repairForm.get('advancePayment')?.setValue(formattedAdvance, { emitEvent: false });
    }

    this.repairForm.get('advancePayment')?.updateValueAndValidity({ emitEvent: false });
  }

  printTicket(): void {
    void this.triggerWorkOrderPrint();
  }

  closeAdvancePaymentTicket(): void {
    this.showAdvancePaymentTicket.set(false);
    this.pendingAdvancePaymentTicket.set(false);
    this.router.navigate(['/repairs']);
  }

  printAdvancePaymentTicket(): void {
    this.repairImpressionTicket.simplePrint();
  }

  private openAdvancePaymentTicket(): void {
    this.pendingAdvancePaymentTicket.set(false);
    this.showAdvancePaymentTicket.set(true);
  }

  private async triggerWorkOrderPrint(redirectAfterPrint = false): Promise<void> {
    if (!this.repair) {
      return;
    }

    const items = this.repair.items?.length ? this.repair.items : [undefined];

    for (let index = 0; index < items.length; index += 1) {
      this.activeTicketItem = items[index] ?? null;
      this.activeTicketIndex = index;
      this.showTicket.set(true);

      await this.waitForTicketRender();

      try {
        await this.repairImpressionTicket.simplePrintAndWait();
      } catch (error) {
        console.error('Error printing work order tickets:', error);
        this.toastService.show('No se pudieron imprimir todos los tickets', 'error');
        this.closeTicket();
        return;
      }
    }

    this.showTicket.set(false);
    this.activeTicketItem = null;
    this.activeTicketIndex = 0;

    if (this.pendingAdvancePaymentTicket()) {
      this.openAdvancePaymentTicket();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.printAdvancePaymentTicket();
          this.closeAdvancePaymentTicket();

          if (redirectAfterPrint) {
            void this.router.navigate(['/repairs']);
          }
        });
      });

      return;
    }

    if (redirectAfterPrint) {
      void this.router.navigate(['/repairs']);
    }
  }
  private waitForTicketRender(): Promise<void> {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }
}
