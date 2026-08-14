import { Component, OnDestroy, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, of, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { takeUntil } from 'rxjs/operators';
import { UserUseCases } from '../../../domain/usecases/user.usecases';
import { RepairUseCases } from '../../../domain/usecases/repair.usecases';
import { RepairStatusUseCases } from '../../../domain/usecases/repair-status.usecases';
import { Repair, RepairStatusEnum } from '../../../core/models/repair.model';
import { RepairStatus } from '@core/models/repair-status.model';
import { PaymentTypeUseCases } from '@domain/usecases/payment-type.usecases';
import { PaymentType } from '@core/models/payment-type.model';
import { PaymentUseCases } from '../../../domain/usecases/payment.usecases';
import { AuthService } from '../../../core/services/auth.service';
import { RepairRealtimeService } from '../../../core/services/repair-realtime.service';
import { User, UserRole, UserRoleCode } from '../../../core/models/user.model';
import { repairImpressionTicket } from '../../../shared/utils/repairImpressionTicket.utils';
import { WhatsappApiService } from '../../../core/services/whatsapp-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';
import { RepairComment } from '@core/models/repair-comment.model';
import { getStoredUserId } from '../../../shared/utils/userLocalData.utils';
import { RepairItem } from '@core/models/repair-item.model';
import { SeamstressAssignModalComponent } from './seamstress-assign-modal.component';
import { UnassignConfirmModalComponent } from './unassign-confirm-modal.component';
import { JobReviewModalComponent } from './job-review-modal.component';
import { ConvertHtmlToPdf } from '../../../shared/utils/convertHtmlToPdf';

@Component({
  selector: 'app-repair-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SeamstressAssignModalComponent,
    UnassignConfirmModalComponent,
    JobReviewModalComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './repair-detail.component.html',
  styleUrls: ['./repair-detail.component.scss', 
    './repair-detail.ticket.scss', 
    './repair-detail.payment.scss', 
    './repair-detail.receipt.scss']
})

export class RepairDetailComponent implements OnInit, OnDestroy {
  // ─── Repair ───────────────────────────────────────────────────
  isLoading = signal(true);
  errorMessage = '';

  // ─── Advance Ticket ───────────────────────────────────────────
  showAdvancePaymentTicket = signal(false);
  pendingAdvancePaymentTicket = signal(false);
  showAssignModalJobReview = signal(false);

  advancePaymentMinimum = 0;
  advancePaymentMaximum = 0;

  repair: Repair | null = null;
  userRole: UserRole | undefined;
  UserRole = UserRoleCode;
  RepairStatus = RepairStatusEnum;
  repairComment: RepairComment[] = [];
  
  comment: string = '';

  // ─── Seamstresses ─────────────────────────────────────────────
  showSeamstressAssignModal = signal(false);
  showUnassignConfirmModal = signal(false);
  isLoadingSeamstresses = signal(false);
  seamstresses: User[] = [];
  selectedSeamstress: User | null = null;
  selectedGarmentItem: RepairItem | null = null;  

  // ─── Repair Ticket ────────────────────────────────────────────
  showTicket = signal(false);
  activeTicketItem: RepairItem | null = null;
  activeTicketIndex = 0;
  qrCodeDataUrl = '';

  // ─── Repair Items ─────────────────────────────────────────────
  repairItems: RepairItem[] = [];
  repairForm!: FormGroup;
  private destroy$ = new Subject<void>();

  // ─── Payment Modal ────────────────────────────────────────────
  showPaymentModal = signal(false);
  paymentType: 'cash' | 'card' | 'transfer' | 'mixed' = 'cash';
  cardType: 'debit' | 'credit' = 'debit';
  voucherId = '';
  cashAmount: string | null = null;
  transferAmount: string | null = null;
  mixedCashAmount: string | null = null;
  mixedCardAmount: string | null = null;
  mixedTransferAmount: string | null = null;

  // ─── Payment Ticket ───────────────────────────────────────────
  showPaymentTicket = signal(false);
  paymentDate: Date = new Date();
  paidPaymentType: 'cash' | 'card' | 'transfer' | 'mixed' = 'cash';
  paidCardType: 'debit' | 'credit' = 'debit';
  paidCashAmount: string | null = null;
  paidTransferAmount: string | null = null;
  paidMixedCashAmount: string | null = null;
  paidMixedCardAmount: string | null = null;
  paidMixedTransferAmount: string | null = null;
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
    private repairRealtimeService: RepairRealtimeService,
    private repairImpressionTicket: repairImpressionTicket,
    private whatsappApiService: WhatsappApiService,
    private toastService: ToastService,
    private convertHtmlToPdfService: ConvertHtmlToPdf
  ) {}

  async ngOnInit(): Promise<void> {
    this.userRole = this.authService.currentUser?.role;
    
    const repairId = this.route.snapshot.paramMap.get('id');
    
    if (repairId) {
      this.loadRepair(repairId);

      this.repairRealtimeService.events$
        .pipe(takeUntil(this.destroy$))
        .subscribe(event => {
          if (event.repair_id === repairId) {
            if (event.repair) {
              this.repair = event.repair;
              return;
            }

            this.loadRepair(repairId);
          }
        });
    } else {
      this.router.navigate(['/repairs']);
    }

    await this.ensureSwiper();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    const status = this.repairStatuses().find(s => s.name === statusName);
    return status || { id: '', name: statusName };
  }

  getItemStatusName(item: RepairItem): string {
    return item.repairStatus?.name || this.repair?.repairStatus?.name || RepairStatusEnum.PENDING;
  }

  getRepairTypeNames(item: RepairItem): string {
    const names = (item.repairTypes ?? []).map(type => type.name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Sin tipo';
  }

  isMuestra(item: RepairItem): boolean {
    return item.isPatternSource === true;
  }

  areAllItemsValidated(): boolean {
    const items = (this.repair?.items || []).filter(item => !item.isPatternSource);
    return items.length > 0 && items.every(item => this.getItemStatusName(item) === RepairStatusEnum.VALIDATED);
  }

  canManageItemStatus(item: RepairItem): boolean {
    if (this.isMuestra(item)) {
      return false;
    }

    if (!this.userRole) {
      return false;
    }

    if (this.areAllItemsValidated()) {
      return false;
    }

    const currentStatusName = this.getItemStatusName(item);
    const currentUserId = this.authService.currentUser?.id;

    // Admin and Receptionist can manage all statuses
    if (this.userRole.code === UserRoleCode.ADMIN)
      return true;

    // Receptionist: can manage transitions between IN_PROGRESS, IN_VALIDATION, VALIDATED
    if (this.userRole.code === UserRoleCode.RECEPTIONIST) {

      if(currentStatusName === RepairStatusEnum.VALIDATED)
        return false;

      return (
        currentStatusName === RepairStatusEnum.IN_PROGRESS ||
        currentStatusName === RepairStatusEnum.IN_VALIDATION ||
        currentStatusName === RepairStatusEnum.VALIDATED);
    }

    // Head Sewing: can manage transitions between IN_PROGRESS, IN_VALIDATION, VALIDATED
    if (this.userRole.code === UserRoleCode.HEADSEWING) {

      if(currentStatusName === RepairStatusEnum.VALIDATED)
        return false;

      return (
        currentStatusName === RepairStatusEnum.IN_PROGRESS ||
        currentStatusName === RepairStatusEnum.IN_VALIDATION ||
        currentStatusName === RepairStatusEnum.VALIDATED);
    }

    // Seamstress: can manage transitions between IN_PROGRESS and IN_VALIDATION (only if assigned)
    if (this.userRole.code === UserRoleCode.SEAMSTRESS) {
      if(!!currentUserId && item.assignedTo?.id === currentUserId)
        return currentStatusName === RepairStatusEnum.IN_VALIDATION ? false 
          : currentStatusName === RepairStatusEnum.IN_PROGRESS ? true : false;
    }

    return false;
  }

  private readonly STATUS_FLOW: RepairStatusEnum[] = [
    RepairStatusEnum.PENDING,
    RepairStatusEnum.IN_PROGRESS,
    RepairStatusEnum.IN_VALIDATION,
    RepairStatusEnum.VALIDATED,
    RepairStatusEnum.DELIVERED
  ];

  getItemPrevStatus(item: RepairItem): RepairStatus | null {
    if (this.isMuestra(item)) {
      return null;
    }

    const currentName = this.getItemStatusName(item) as RepairStatusEnum;
    
    const idx = this.STATUS_FLOW.indexOf(currentName);
    if (idx <= 0) 
      return null;

    const prevName = this.STATUS_FLOW[idx - 1];
    if (this.userRole?.code === UserRoleCode.SEAMSTRESS && (prevName === RepairStatusEnum.PENDING || prevName === RepairStatusEnum.IN_PROGRESS))
      return null;
    
    const status = this.getRepairStatus(prevName);
    return status.id ? status : null;
  }

  getItemNextStatus(item: RepairItem): RepairStatus | null {
    if (this.isMuestra(item)) {
      return null;
    }

    const currentName = this.getItemStatusName(item) as RepairStatusEnum;
    
    if (currentName === RepairStatusEnum.PENDING) 
      return null;
    
    const idx = this.STATUS_FLOW.indexOf(currentName);
    if (idx < 0 || idx >= this.STATUS_FLOW.length - 1) 
      return null;
    
    const nextName = this.STATUS_FLOW[idx + 1];
    if (this.userRole?.code === UserRoleCode.SEAMSTRESS && nextName === RepairStatusEnum.VALIDATED) 
      return null;
    
    const status = this.getRepairStatus(nextName);
    return status.id ? status : null;
  }

  onStatusBadgeClick(item: RepairItem, targetStatus: RepairStatus): void {
    if (this.isMuestra(item)) {
      return;
    }

    const currentStatusName = this.getItemStatusName(item);
    
    if (!targetStatus.id || currentStatusName === targetStatus.name) 
      return;

    if (currentStatusName === RepairStatusEnum.IN_PROGRESS && targetStatus.name === RepairStatusEnum.PENDING) {
      this.revertToPendingAndUnassign(item, targetStatus);
      
      return;
    }

    // Check if transitioning from IN_VALIDATION to IN_PROGRESS
    const isValidationToProgressTransition = currentStatusName === RepairStatusEnum.IN_VALIDATION && targetStatus.name === RepairStatusEnum.IN_PROGRESS;
    this.updateItemStatus(item, targetStatus, isValidationToProgressTransition);    
  }

  private revertToPendingAndUnassign(item: RepairItem, pendingStatus: RepairStatus): void {
    if (!this.repair?.id || !item.id) return;
    const itemId = item.id;
    const assignments = [{ itemId, seamstressId: undefined }];

    this.repairUseCases.assignRepairGarments(this.repair.id, assignments).subscribe({
      next: (updatedRepair) => {
        updatedRepair.items = (updatedRepair.items || []).map(i =>
          i.id === itemId ? { ...i, assignedToId: undefined, assignedTo: undefined } : i
        );
        this.repair = updatedRepair;
        this.updateItemStatus(item, pendingStatus);
      },
      error: () => {
        this.toastService.show('Error al revertir la prenda', 'error', 'bottom-right');
      }
    });
  }

  getItemStatusTransitions(item: RepairItem): RepairStatus[] {
    if (this.isMuestra(item)) {
      return [];
    }

    const currentName = this.getItemStatusName(item);

    if (this.userRole?.code === UserRoleCode.SEAMSTRESS) {
      if (currentName === RepairStatusEnum.IN_PROGRESS) {
        return [
          this.getRepairStatus(RepairStatusEnum.IN_VALIDATION)
        ];
      }

      // If the current status is IN_VALIDATION, no transitions are available
      if (currentName === RepairStatusEnum.IN_VALIDATION) {
        return [];
      }

      return [this.getRepairStatus(currentName)];
    }

    if (currentName === RepairStatusEnum.PENDING) {
      return [
        this.getRepairStatus(RepairStatusEnum.PENDING),
        this.getRepairStatus(RepairStatusEnum.IN_PROGRESS)
      ];
    }

    if (currentName === RepairStatusEnum.IN_PROGRESS) {
      return [
        this.getRepairStatus(RepairStatusEnum.PENDING),
        this.getRepairStatus(RepairStatusEnum.IN_PROGRESS),
        this.getRepairStatus(RepairStatusEnum.IN_VALIDATION)
      ];
    }

    if (currentName === RepairStatusEnum.IN_VALIDATION) {
      return [
        this.getRepairStatus(RepairStatusEnum.IN_PROGRESS),
        this.getRepairStatus(RepairStatusEnum.IN_VALIDATION),
        this.getRepairStatus(RepairStatusEnum.VALIDATED)
      ];
    }

    if (currentName === RepairStatusEnum.VALIDATED) {
      return [
        this.getRepairStatus(RepairStatusEnum.IN_VALIDATION),
        this.getRepairStatus(RepairStatusEnum.VALIDATED),
        this.getRepairStatus(RepairStatusEnum.DELIVERED)
      ];
    }

    return [this.getRepairStatus(RepairStatusEnum.DELIVERED)];
  }

  onItemStatusChange(item: RepairItem, selectedStatusName: string): void {
    const currentStatusName = this.getItemStatusName(item);
    if (selectedStatusName === currentStatusName)
      return;

    const selectedStatus = this.getRepairStatus(selectedStatusName);
    if (!selectedStatus.id) 
      return;

    this.updateItemStatus(item, selectedStatus);
  }

  updateItemStatus(item: RepairItem, newStatus: RepairStatus, openCommentsModal: boolean = false): void {
    if (!item.id) {
      return;
    }

    this.repairUseCases.updateRepairItemStatus(item.id, newStatus).subscribe({
      next: (updatedRepair) => {
        this.repair = updatedRepair;
        this.toastService.show('Estado de la prenda actualizado', 'success');
        
        if (openCommentsModal) {
          this.openAssignModalJobReview();
        }

        if (updatedRepair?.repairStatus?.name === RepairStatusEnum.VALIDATED) {
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
            }});}
      },
      error: (error) => {
        this.toastService.show('Error al actualizar el estado de la prenda', 'error', 'bottom-right');
        this.errorMessage = error.message || 'Error al actualizar el estado de la prenda';}
    });
  }

  hasItemsInWork(): boolean {
    const items = this.repair?.items || [];
    return items.some(item => {
      const statusName = this.getItemStatusName(item);
      return statusName === RepairStatusEnum.PENDING || statusName === RepairStatusEnum.IN_PROGRESS;
    });
  }

  // ─── Seamstresses ─────────────────────────────────────────────
  openSeamstressAssignModal(item: RepairItem): void {
    if (this.isMuestra(item)) {
      return;
    }

    this.selectedGarmentItem = item;
    this.selectedSeamstress = item.assignedTo || null;
    this.loadSeamstresses();
    this.showSeamstressAssignModal.set(true);
  }

  closeSeamstressAssignModal(): void {
    this.showSeamstressAssignModal.set(false);
    this.closeUnassignConfirmModal();
    this.selectedGarmentItem = null;
    this.selectedSeamstress = null;
  }

  openUnassignConfirmModal(): void {
    this.showUnassignConfirmModal.set(true);
  }

  closeUnassignConfirmModal(): void {
    this.showUnassignConfirmModal.set(false);
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
    
    this.userUseCases.getUnassignedSeamstressesAndHeadSewing().subscribe({
      next: (users) => {
        this.seamstresses = users.filter(u => u.isActive);
        this.isLoadingSeamstresses.set(false);
      },
      error: () => {
        this.isLoadingSeamstresses.set(false);
      }});
  }

  isSeamstressAlreadyAssigned(seamstress: User): boolean {
    return (this.repair?.items || []).some(item =>
      item.id !== this.selectedGarmentItem?.id &&
      (item.assignedTo?.id === seamstress.id || item.assignedToId === seamstress.id));
  }

  selectSeamstress(seamstress: User): void {
    if (this.isSeamstressAlreadyAssigned(seamstress)) return;
    this.selectedSeamstress = seamstress;
  }

  assignSeamstressToGarment(): void {
    if (!this.repair?.id || !this.selectedGarmentItem || !this.selectedSeamstress)
      return;

    const selectedGarmentItemId = this.selectedGarmentItem.id;
    const selectedSeamstress = this.selectedSeamstress;
    const wasItemPending = this.getItemStatusName(this.selectedGarmentItem) === RepairStatusEnum.PENDING;

    const assignments = [{
      itemId: this.selectedGarmentItem.id!,
      seamstressId: this.selectedSeamstress.id
    }];

    this.repairUseCases.assignRepairGarments(this.repair.id, assignments)
      .subscribe({
        next: (updatedRepair) => {
          if (selectedGarmentItemId) {
            updatedRepair.items = (updatedRepair.items || []).map(item =>
              item.id === selectedGarmentItemId
                ? {
                    ...item,
                    assignedToId: selectedSeamstress.id,
                    assignedTo: item.assignedTo || selectedSeamstress
                  }
                : item
            );
          }

          this.repair = updatedRepair;
          
          // If item was pending, transition it to IN_PROGRESS
          if (wasItemPending && selectedGarmentItemId) {
            const item = this.repair.items?.find(i => i.id === selectedGarmentItemId);
            if (item) {
              const inProgressStatus = this.getRepairStatus(RepairStatusEnum.IN_PROGRESS);
              if (inProgressStatus.id) {
                this.updateItemStatus(item, inProgressStatus);
              }
            }
          }

          this.toastService.show('Prenda asignada exitosamente', 'success', 'bottom-right');
          this.closeSeamstressAssignModal();
        },
        error: (error) => {
          this.toastService.show('Error al asignar la prenda', 'error', 'bottom-right');
          console.error(error);
          this.errorMessage = error.message || 'Error al asignar la prenda';
        }
      });
  }

  unassignSeamstressFromGarment(): void {
    if (!this.repair?.id || !this.selectedGarmentItem?.id)
      return;

    this.closeUnassignConfirmModal();

    const selectedGarmentItemId = this.selectedGarmentItem.id;
    const assignments = [{
      itemId: selectedGarmentItemId,
      seamstressId: undefined
    }];

    this.repairUseCases.assignRepairGarments(this.repair.id, assignments)
      .subscribe({
        next: (updatedRepair) => {
          updatedRepair.items = (updatedRepair.items || []).map(item =>
            item.id === selectedGarmentItemId
              ? {
                  ...item,
                  assignedToId: undefined,
                  assignedTo: undefined
                }
              : item
          );

          this.repair = updatedRepair;
          
          // Automatically transition to PENDING status
          if (selectedGarmentItemId) {
            const item = this.repair.items?.find(i => i.id === selectedGarmentItemId);
            if (item) {
              const pendingStatus = this.getRepairStatus(RepairStatusEnum.PENDING);
              if (pendingStatus.id) {
                this.updateItemStatus(item, pendingStatus);
              }
            }
          }

          this.toastService.show('Asignación removida. Prenda en estado Pendiente', 'success', 'bottom-right');
          this.closeSeamstressAssignModal();
        },
        error: (error) => {
          this.toastService.show('Error al desasignar la prenda', 'error', 'bottom-right');
          console.error(error);
          this.errorMessage = error.message || 'Error al desasignar la prenda';
        }
      });
  }

  isAssigned(): boolean {
    return this.repair?.items?.some(item => !!item.assignedToId || !!item.assignedTo) ?? false;
  }

  async confirmJobReview(): Promise<void> {
    if (!this.comment.trim() || !this.repair) 
      return;

    const currentUserId = getStoredUserId() ?? '';

    this.repairUseCases.addComment(this.repair.id, this.comment.trim(), currentUserId).subscribe({
      next: (savedComment) => {
        this.repairComment = [savedComment, ...(Array.isArray(this.repairComment) ? this.repairComment : [])];
        this.comment = '';

        this.toastService.show('Comentario agregado exitosamente', 'success');
        this.closeAssignModalJobReview();
      },
      error: (error) => {
        this.toastService.show('Error al agregar el comentario: ' + error.message, 'error');
      }
    });
  }

  isNotAllowedToDeliver(): boolean {
    return this.repair?.repairStatus?.name === RepairStatusEnum.VALIDATED && this.hasItemsInWork();
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

  settlementPaymentTicketUrl: string | null = null;

  confirmPayment(): void {
    if (!this.repair) 
      return;

    const deliveredStatus = this.getRepairStatus(RepairStatusEnum.DELIVERED);
    
    this.repairUseCases.updateRepairStatus(this.repair.id, deliveredStatus).subscribe({
      next: (updatedRepair) => {
        const remaining = this.getRemainingBalance();
        const cashPaid = this.getNumericAmount(this.cashAmount);
        const transferPaid = this.getNumericAmount(this.transferAmount);
        const mixedCashPaid = this.getNumericAmount(this.mixedCashAmount);
        const mixedCardPaid = this.getNumericAmount(this.mixedCardAmount);
        const mixedTransferPaid = this.getNumericAmount(this.mixedTransferAmount);
        const mixedTotal = this.roundToTwo(mixedCashPaid + mixedCardPaid + mixedTransferPaid);

        this.paidPaymentType = this.paymentType;
        this.paidCardType = this.cardType;
        this.paidVoucherId = this.voucherId;
        this.paidCashAmount = this.cashAmount ?? "0";
        this.paidMixedCashAmount = this.mixedCashAmount ?? "0";
        this.paidMixedCardAmount = this.mixedCardAmount ?? "0";
        this.paidMixedTransferAmount = this.mixedTransferAmount ?? "0";
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
            ? (cashPaid > 0  && cashPaid > remaining ? remaining : cashPaid)
            : 0;
        const transferPaymentAmount = this.paymentType === 'mixed'
          ? mixedTransferPaid
          : this.paymentType === 'transfer'
            ? (transferPaid > 0 ? transferPaid : remaining)
            : 0;
        const cardPaymentAmount = this.paymentType === 'mixed'
          ? mixedCardPaid
          : this.paymentType === 'card'
            ? remaining
            : 0;
        const needsCash = cashPaymentAmount > 0;
        const needsCard = cardPaymentAmount > 0;
        const needsTransfer = transferPaymentAmount > 0;
        const paymentTypeCash = needsCash ? this.resolveSelectedAdvancePaymentType('cash') : undefined;
        const paymentTypeCard = needsCard ? this.resolveSelectedAdvancePaymentType('card') : undefined;
        const paymentTypeTransfer = needsTransfer ? this.resolveSelectedAdvancePaymentType('transfer') : undefined;

        if ((needsCash && !paymentTypeCash) || (needsCard && !paymentTypeCard) || (needsTransfer && !paymentTypeTransfer)) {
          if (needsCash && !paymentTypeCash && needsCard && !paymentTypeCard && needsTransfer && !paymentTypeTransfer) {
            this.toastService.show('La reparación se actualizó, pero no se pudieron mapear los tipos de pago de la reparación.', 'error');
          } else if (needsCash && !paymentTypeCash) {
            this.toastService.show('La reparación se actualizó, pero no se pudo mapear el tipo de pago en efectivo.', 'error');
          } else if (needsCard && !paymentTypeCard) {
            this.toastService.show('La reparación se actualizó, pero no se pudo mapear el tipo de pago con tarjeta.', 'error');
          } else if (needsTransfer && !paymentTypeTransfer) {
            this.toastService.show('La reparación se actualizó, pero no se pudo mapear el tipo de pago con transferencia.', 'error');
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

        if (needsTransfer && paymentTypeTransfer) {
          paymentRequests.push(this.paymentUseCases.createPayment({
            repair: updatedRepair,
            paymentType: paymentTypeTransfer,
            amount: transferPaymentAmount,
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
          this.showPaymentTicket.set(true);

          setTimeout(() => {
            this.printPaymentTicket();
            this.closePaymentTicket();
            this.goBack();
          }, 100);

          this.handleRepairUpdated(updatedRepair);
          this.closePaymentModal();
          
          return;
        }

        forkJoin(paymentRequests).subscribe({
          next: () => { this.handleRepairUpdated(updatedRepair); },
          error: () => {
            this.toastService.show('La reparación se actualizó, pero no se pudo registrar el pago.', 'error');
            this.handleRepairUpdated(updatedRepair);}});

        // this.closePaymentModal();        

        setTimeout(async () => {
          this.showPaymentTicket.set(true);

          await this.waitForTicketRender();          
          
          try {
            const blob = await this.convertHtmlToPdfService.convertirHtmlToPdf("SettlementPaymentTicketPdf", "SettlementPaymentTicket.pdf");
            const url = await firstValueFrom(this.paymentUseCases.uploadFinalPaymentPdf(this.repair?.id!, blob));
            
            this.settlementPaymentTicketUrl = url;
          } catch (uploadError) {
            console.warn('Upload falló, pero la descarga continúa: ', uploadError);
            
            this.toastService.show('No se pudo subir el PDF del ticket de pago.', 'error');
          }
          
          this.printPaymentTicket();
          this.closePaymentTicket();
          this.goBack();
        }, 100);

        // setTimeout(() => 
          this.whatsappApiService.sendNotification({
            phone: updatedRepair.customerPhone,
            customer_name: updatedRepair.customerName,
            repair_id: updatedRepair.id.substring(0, 8),
            event: 'delivered',
            url: this.settlementPaymentTicketUrl || undefined
          }).subscribe(result => {
            if (result.success) {
              this.toastService.show('Notificación WhatsApp enviada al cliente', 'success');
            } else {
              this.toastService.show('No se pudo enviar la notificación WhatsApp', 'error');
            }
          })
          // , 5000);
      },
      error: (error) => { this.errorMessage = error.message || 'Error al actualizar el estado';}});
  }

  onPaymentTypeChange(selectedType: 'cash' | 'card' | 'transfer' | 'mixed'): void {
    if (selectedType === 'card') {
      this.cashAmount = null;
      this.mixedCashAmount = null;
      this.mixedCardAmount = null;
      this.mixedTransferAmount = null;
      
      return;
    }

    if (selectedType === 'cash') {
      this.transferAmount = null;
      this.mixedCashAmount = null;
      this.mixedCardAmount = null;
      this.mixedTransferAmount = null;

      return;
    }

    this.cashAmount = null;
    this.transferAmount = null;
  }

  isEnabledConfirmPayment(): boolean {
    const remaining = this.getRemainingBalance();

    if(remaining <= 0) {
      return false;
    }

    if (this.paymentType === 'cash') {
      const cashPaid = this.getNumericAmount(this.cashAmount);
      
      return !this.cashAmount?.trim() || cashPaid < remaining;
    }

    if (this.paymentType === 'transfer') {
      const transferPaid = this.getNumericAmount(this.transferAmount);
      
      return !this.transferAmount?.trim() || transferPaid < remaining;
    }

    if (this.paymentType === 'card') {
      return !this.voucherId.trim();
    }

    const mixedCash = this.getNumericAmount(this.mixedCashAmount);
    const mixedCard = this.getNumericAmount(this.mixedCardAmount);
    const mixedTransfer = this.getNumericAmount(this.mixedTransferAmount);
    const mixedTotal = this.roundToTwo(mixedCash + mixedCard + mixedTransfer);

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

  onTransferAmountInput(event: Event): void {
    this.transferAmount = this.sanitizeDecimalInput(event);
  }

  onMixedCashAmountInput(event: Event): void {
    this.mixedCashAmount = this.sanitizeDecimalInput(event);
  }

  onMixedTransferAmountInput(event: Event): void {
    this.mixedTransferAmount = this.sanitizeDecimalInput(event);
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
      const transferPaid = this.getNumericAmount(this.paidMixedTransferAmount);
      const change = cashPaid - Math.max(0, remaining - cardPaid - transferPaid);
      
      return this.roundToTwo(Math.max(0, change));
    }

    if (this.paidPaymentType === 'cash') {
      const paid = this.getNumericAmount(this.paidCashAmount);
      
      return this.roundToTwo(paid - remaining);
    }

    return 0;
  }

  // ─── Payment Ticket ───────────────────────────────────────────
  getPaymentTypeLabel(): string {
    if(this.getRemainingBalance() <= 0)
      return "Sin pago pendiente";

    if(this.paidPaymentType === "cash")
      return "Efectivo";

    if(this.paidPaymentType === "card") {
      if(this.paidCardType === "debit")
        return "Tarjeta (Débito)";

      return "Tarjeta (Crédito)";
    }

    if(this.paidPaymentType === "transfer")
      return "Transferencia";

    if(this.paidPaymentType === "mixed")
      return "Pago mixto";
    
    return "";
  }

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

  private resolveSelectedAdvancePaymentType(paymentType: 'cash' | 'card' | 'transfer'): PaymentType | undefined {
    const aliases = paymentType === 'cash'
      ? ['cash', 'efectivo']
      : paymentType === 'card'
        ? ['card', 'tarjeta']
        : ['transfer', 'transferencia'];

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
