import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RepairUseCases } from '../../../domain/usecases/repair.usecases';
import { RepairStatusEnum } from '../../../core/models/repair.model';
import { UserRole, UserRoleCode } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

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

export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    inValidation: 0,
    validated: 0,
    delivered: 0};

  isLoading = signal(true);

  userRole: UserRole | undefined;
  UserRole = UserRoleCode;
  RepairStatus = RepairStatusEnum;

  constructor(
    private repairUseCases: RepairUseCases,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.currentUser?.role;
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    
    this.repairUseCases.getAllRepairs().subscribe({
      next: (repairs) => {
        this.stats.total = repairs.length;
        this.stats.pending = repairs.filter(r => r.repairStatus.name === RepairStatusEnum.PENDING).length;
        this.stats.inProgress = repairs.filter(r => r.repairStatus.name === RepairStatusEnum.IN_PROGRESS).length;
        this.stats.inValidation = repairs.filter(r => r.repairStatus.name === RepairStatusEnum.IN_VALIDATION).length;
        this.stats.validated = repairs.filter(r => r.repairStatus.name === RepairStatusEnum.VALIDATED).length;
        this.stats.delivered = repairs.filter(r => r.repairStatus.name === RepairStatusEnum.DELIVERED).length;
        },
      error: () => {}});

    this.isLoading.set(false);
  }

  navigateToRepairs(repairStatus?: RepairStatusEnum): void {
    if (repairStatus) {
      this.router.navigate(['/repairs'], { queryParams: { status: repairStatus } });
    } else {
      this.router.navigate(['/repairs']);
    }
  }  
}
