import { Component, OnDestroy, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { RepairUseCases } from '../../../domain/usecases/repair.usecases';
import { Repair, RepairStatusEnum } from '../../../core/models/repair.model';
import { AuthService } from '../../../core/services/auth.service';
import { RepairRealtimeService } from '../../../core/services/repair-realtime.service';
import { UserRole, UserRoleCode } from '../../../core/models/user.model';
import { removeRepairById, upsertRepairById } from '../../../shared/utils/repair-realtime.utils';
import { getAggregateRepairStatus } from '../../../shared/utils/repair-status-aggregation.utils';

@Component({
  selector: 'app-repairs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './repairs.component.html',
  styleUrls: ['./repairs.component.scss']
})

export class RepairsComponent implements OnInit, OnDestroy {
  isLoading = signal(true);

  repairs: Repair[] = [];
  filteredRepairs: Repair[] = [];
  selectedStatus: string = 'ALL';
  customerSearchTerm = '';
  RepairStatus = RepairStatusEnum;
  userRole: UserRole | undefined;
  UserRole = UserRoleCode;
  private destroy$ = new Subject<void>();

  statusOptions = [
    { value: 'ALL', label: 'Todas las reparaciones' },
    { value: RepairStatusEnum.PENDING, label: 'Pendientes' },
    { value: RepairStatusEnum.IN_PROGRESS, label: 'En progreso' },
    { value: RepairStatusEnum.IN_VALIDATION, label: 'Por Validar' },
    { value: RepairStatusEnum.VALIDATED, label: 'Validadas' },
    { value: RepairStatusEnum.DELIVERED, label: 'Entregadas' }];

  constructor(
    private repairUseCases: RepairUseCases,
    private authService: AuthService,
    private route: ActivatedRoute,
    private repairRealtimeService: RepairRealtimeService
  ) {}

  ngOnInit(): void {
    void this.ensureSwiper();
    this.userRole = this.authService.currentUser?.role;
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const status = params['status'];
      
      if (status && this.statusOptions.some(opt => opt.value === status)) {
        this.selectedStatus = status;
      }
      
      this.loadRepairs();});

    this.repairRealtimeService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (!event.repair) {
          this.loadRepairs();
          return;
        }

        this.applyRealtimeRepairUpdate(event.repair);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async ensureSwiper(): Promise<void> {
    if (typeof customElements === 'undefined') {
      return;
    }

    if (customElements.get('swiper-container')) {
      return;
    }

    registerSwiperElements();
  }

  loadRepairs(): void {
    this.isLoading.set(true);

    const isSeamstress = this.userRole?.code === UserRoleCode.SEAMSTRESS;
    const isHeadSewing = this.userRole?.code === UserRoleCode.HEADSEWING;
    const currentUserId = this.authService.currentUser?.id;

    const excludedHeadSewingStatuses = new Set<string>([
      RepairStatusEnum.VALIDATED,
      RepairStatusEnum.DELIVERED
    ]);

    const repairs$ = isSeamstress && currentUserId
      ? this.repairUseCases.getRepairsByAssignedUser(currentUserId).pipe(
          map(repairs => {
            return repairs.filter(repair => {
              const aggregateStatus = this.getAggregateStatusName(repair);
              return aggregateStatus !== RepairStatusEnum.PENDING 
              && aggregateStatus !== RepairStatusEnum.VALIDATED 
              && aggregateStatus !== RepairStatusEnum.DELIVERED;
            });
          }))
      : this.repairUseCases.getAllRepairs();

    repairs$.subscribe({
      next: (repairs) => {
        this.repairs = isHeadSewing
          ? repairs.filter(repair => !excludedHeadSewingStatuses.has(this.getAggregateStatusName(repair)))
          : repairs;

        this.filterRepairs();
        this.isLoading.set(false);},
      error: (err) => { 
        console.error('Error loading repairs:', err);
        this.isLoading.set(false);
      }});
  }

  private applyRealtimeRepairUpdate(repair: Repair): void {
    const visibleRepair = this.getVisibleRepair(repair);

    this.repairs = visibleRepair
      ? upsertRepairById(this.repairs, visibleRepair)
      : removeRepairById(this.repairs, repair.id);

    this.filterRepairs();
  }

  private getVisibleRepair(repair: Repair): Repair | null {
    const aggregateStatus = this.getAggregateStatusName(repair);
    const currentUserId = this.authService.currentUser?.id;

    if (this.userRole?.code === UserRoleCode.SEAMSTRESS) {
      const isAssignedToCurrentUser = (repair.items ?? []).some(item =>
        item.assignedTo?.id === currentUserId || item.assignedToId === currentUserId
      );

      if (!isAssignedToCurrentUser) {
        return null;
      }

      if (
        aggregateStatus === RepairStatusEnum.PENDING ||
        aggregateStatus === RepairStatusEnum.VALIDATED ||
        aggregateStatus === RepairStatusEnum.DELIVERED
      ) {
        return null;
      }
    }

    if (
      this.userRole?.code === UserRoleCode.HEADSEWING &&
      (aggregateStatus === RepairStatusEnum.VALIDATED || aggregateStatus === RepairStatusEnum.DELIVERED)
    ) {
      return null;
    }

    return repair;
  }

  filterRepairs(): void {
    const sourceByStatus = this.selectedStatus === 'ALL'
      ? this.repairs
      : this.repairs.filter(r => this.getAggregateStatusName(r) === this.selectedStatus);

    const normalizedSearch = this.normalizeSearchText(this.customerSearchTerm.trim());
    const source = normalizedSearch
      ? sourceByStatus.filter(repair =>
          this.normalizeSearchText(repair.customerName).includes(normalizedSearch)
        )
      : sourceByStatus;

    this.filteredRepairs = source.slice().sort(
      (a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }

  onCustomerSearchChange(searchTerm: string): void {
    this.customerSearchTerm = searchTerm;
    this.filterRepairs();
  }

  clearCustomerSearch(): void {
    if (!this.customerSearchTerm) {
      return;
    }

    this.customerSearchTerm = '';
    this.filterRepairs();
  }

  private normalizeSearchText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.filterRepairs();
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

  getAggregateStatusName(repair: Repair): RepairStatusEnum {
    return getAggregateRepairStatus(repair);
  }

  getStatusLabel(status: RepairStatusEnum): string {
    return status;
  }

  /** True when ANY repair in the full list is pending + express (forces priority assignment) */
  get hasPendingExpress(): boolean {
    return this.repairs.some(r => r.isExpress && this.getAggregateStatusName(r) === RepairStatusEnum.PENDING);
  }

  /** A card is blocked when there is a pending+express repair and THIS card is not that repair */
  isCardBlocked(repair: Repair): boolean {
    const aggregateStatus = this.getAggregateStatusName(repair);

    return this.hasPendingExpress 
    && !(repair.isExpress && aggregateStatus === RepairStatusEnum.PENDING)
    && aggregateStatus !== RepairStatusEnum.IN_PROGRESS 
    && aggregateStatus !== RepairStatusEnum.IN_VALIDATION
    && aggregateStatus !== RepairStatusEnum.VALIDATED;
  }

  getAssignedSeamstresses(repair: Repair): string | null {
    const items = repair.items ?? [];
    const seamstresses = items
      .map(item => item.assignedTo?.name)
      .filter((name): name is string => !!name);
    
    return seamstresses.length > 0 ? seamstresses.join(', ') : null;
  }
}
