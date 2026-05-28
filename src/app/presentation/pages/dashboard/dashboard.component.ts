import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RepairUseCases } from '../../../domain/usecases/repair.usecases';
import { Repair, RepairStatusEnum } from '../../../core/models/repair.model';
import { UserRole, UserRoleCode } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { RepairRealtimeService } from '../../../core/services/repair-realtime.service';
import { upsertRepairById } from '../../../shared/utils/repair-realtime.utils';
import { getAggregateRepairStatus } from '../../../shared/utils/repair-status-aggregation.utils';

interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  inValidation: number;
  validated: number;
  delivered: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    inValidation: 0,
    validated: 0,
    delivered: 0};

  isLoading = signal(true);
  repairs: Repair[] = [];

  userRole: UserRole | undefined;
  UserRole = UserRoleCode;
  RepairStatus = RepairStatusEnum;
  private destroy$ = new Subject<void>();

  constructor(
    private repairUseCases: RepairUseCases,
    private authService: AuthService,
    private router: Router,
    private repairRealtimeService: RepairRealtimeService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.currentUser?.role;
    this.loadDashboardData();

    this.repairRealtimeService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (!event.repair) {
          this.loadDashboardData();
          return;
        }

        this.repairs = upsertRepairById(this.repairs, event.repair);
        this.updateStats();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    
    this.repairUseCases.getAllRepairs().subscribe({
      next: (repairs) => {
        this.repairs = repairs;
        this.updateStats();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private updateStats(): void {
    this.stats.total = this.repairs.length;
    this.stats.pending = this.repairs.filter(r => getAggregateRepairStatus(r) === RepairStatusEnum.PENDING).length;
    this.stats.inProgress = this.repairs.filter(r => getAggregateRepairStatus(r) === RepairStatusEnum.IN_PROGRESS).length;
    this.stats.inValidation = this.repairs.filter(r => getAggregateRepairStatus(r) === RepairStatusEnum.IN_VALIDATION).length;
    this.stats.validated = this.repairs.filter(r => getAggregateRepairStatus(r) === RepairStatusEnum.VALIDATED).length;
    this.stats.delivered = this.repairs.filter(r => getAggregateRepairStatus(r) === RepairStatusEnum.DELIVERED).length;
  }

  navigateToRepairs(repairStatus?: RepairStatusEnum): void {
    if (repairStatus) {
      this.router.navigate(['/repairs'], { queryParams: { status: repairStatus } });
    } else {
      this.router.navigate(['/repairs']);
    }
  }  
}
