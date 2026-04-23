import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { RepairRepository } from '../../../data/repositories/repair.repository';
import { Repair, RepairStatusEnum } from '../../../core/models/repair.model';
import { User } from '../../../core/models/user.model';
import { UserRepository } from '../../../data/repositories/user.repository';
import { DateFormatDirective } from '../../../shared/directives/date-format.directive';

Chart.register(...registerables);

interface ReportStats {
  totalRepairs: number;
  totalRevenue: number;
  averageRepairTime: number;
  completionRate: number;
}

interface SeamstressSales {
  seamstress: User;
  totalRepairs: number;
  completedRepairs: number;
  totalRevenue: number;
  averageRevenue: number;
  completionRate: number;
}

interface IncomeDetail {
  repair: Repair;
  seamstress: string;
  date: Date;
  income: number;
  status: RepairStatusEnum;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFormatDirective],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})

export class ReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  repairs: Repair[] = [];
  filteredRepairs: Repair[] = [];
  stats: ReportStats = {
    totalRepairs: 0,
    totalRevenue: 0,
    averageRepairTime: 0,
    completionRate: 0};

  // Tabs
  activeTab: 'graphics' | 'income' = 'graphics';

  // Date filters for graphics tab
  startDate: string = '';
  endDate: string = '';

  // Income tab filters
  incomeStartDate: string = '';
  incomeEndDate: string = '';
  selectedSeamstress: string = 'all';
  seamstresses: User[] = [];
  headSewing: User[] = [];
  incomeDetails: IncomeDetail[] = [];
  filteredIncomeDetails: IncomeDetail[] = [];
  totalFilteredIncome: number = 0;

  // Seamstress sales data
  seamstressSales: SeamstressSales[] = [];

  private statusChart: Chart | null = null;
  private typeChart: Chart | null = null;
  private revenueChart: Chart | null = null;

  constructor(
    private repairRepository: RepairRepository,
    private userRepository: UserRepository
  ) {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.incomeEndDate = this.toInputDate(today);
    this.incomeStartDate = this.toInputDate(thirtyDaysAgo);
  }

  ngOnInit(): void {
    this.loadData();
    this.loadSeamstresses();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.activeTab === 'graphics') {
        this.createCharts();
      }}, 100);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private loadData(): void {
    this.repairRepository.getAll().subscribe((repairs: Repair[]) => {
      this.repairs = repairs;
      this.applyDateFilters();
      this.prepareIncomeDetails();
      this.applyIncomeFilters();});
  }

  private loadSeamstresses(): void {
    this.userRepository.getAll().subscribe((users: User[]) => {
      this.seamstresses = users.filter(u => u.role.name.includes('Costurera'));
      this.headSewing = users.filter(u => u.role.name.includes('Jefa de Costura'));});
      
  }

  switchTab(tab: 'graphics' | 'income'): void {
    this.activeTab = tab;

    if (tab === 'graphics') {
      setTimeout(() => this.createCharts(), 100);
    }
  }

  applyDateFilters(): void {
    const start = this.startDate ? this.parseInputDate(this.startDate) : null;
    const end = this.endDate ? this.parseInputDate(this.endDate, true) : null;

    if (!start && !end) {
      this.filteredRepairs = this.repairs;
    } else {
      this.filteredRepairs = this.repairs.filter(repair => {
        const repairDate = new Date(repair.receivedDate);
        if (start && repairDate < start) return false;
        if (end && repairDate > end) return false;
        return true;
      });
    }

    this.calculateStats();
    this.calculateSeamstressSales();
    this.createCharts();
  }

  onDateFilterChange(): void {
    this.applyDateFilters();
  }

  clearFilters(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.endDate = this.toInputDate(today);
    this.startDate = this.toInputDate(thirtyDaysAgo);
    this.applyDateFilters();
  }

  // Income tab methods
  prepareIncomeDetails(): void {
    this.incomeDetails = this.repairs
      .filter(repair => repair.repairStatus.name === RepairStatusEnum.DELIVERED)
      .map(repair => ({
        repair: repair,
        seamstress: repair.assignedTo?.name || 'Sin asignar',
        date: new Date(repair.actualDeliveryDate ?? repair.updatedAt ?? repair.receivedDate),
        income: this.getRepairRevenue(repair),
        status: repair.repairStatus.name as RepairStatusEnum}))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  applyIncomeFilters(): void {
    let filtered = [...this.incomeDetails];

    // Filter by date range
    const start = this.incomeStartDate ? this.parseInputDate(this.incomeStartDate) : null;
    const end = this.incomeEndDate ? this.parseInputDate(this.incomeEndDate, true) : null;

    if (start || end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;});
    }

    // Filter by seamstress
    if (this.selectedSeamstress !== 'all') {
      filtered = filtered.filter(item => item.seamstress === this.selectedSeamstress);
    }

    this.filteredIncomeDetails = filtered;
    this.totalFilteredIncome = filtered.reduce((sum, item) => sum + this.toFiniteNumber(item.income), 0);
  }

  onIncomeFilterChange(): void {
    this.applyIncomeFilters();
  }

  clearIncomeFilters(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.incomeEndDate = this.toInputDate(today);
    this.incomeStartDate = this.toInputDate(thirtyDaysAgo);
    this.selectedSeamstress = 'all';

    this.applyIncomeFilters();
  }

  private calculateStats(): void {
    this.stats.totalRepairs = this.filteredRepairs.length;

    const deliveredRepairs = this.filteredRepairs.filter(r => 
      r.repairStatus.name === RepairStatusEnum.DELIVERED);

    this.stats.totalRevenue = deliveredRepairs.reduce((sum, repair) => {
      return sum + this.getRepairRevenue(repair);}, 0);

    this.stats.completionRate = this.filteredRepairs.length > 0 
      ? (deliveredRepairs.length / this.filteredRepairs.length) * 100 
      : 0;

    const repairsWithDates = this.filteredRepairs.filter(r => 
      r.actualDeliveryDate && r.receivedDate);

    if (repairsWithDates.length > 0) {
      const totalDays = repairsWithDates.reduce((sum, repair) => {
        const received = new Date(repair.receivedDate).getTime();
        const delivered = new Date(repair.actualDeliveryDate!).getTime();
        const days = (delivered - received) / (1000 * 60 * 60 * 24);
        return sum + days;}, 0);

      this.stats.averageRepairTime = totalDays / repairsWithDates.length;
    }
  }

  private calculateSeamstressSales(): void {
    const seamstressMap = new Map<string, SeamstressSales>();

    this.filteredRepairs.forEach(repair => {
      if (repair.assignedTo) {
        const key = repair.assignedTo.id;

        if (!seamstressMap.has(key)) {
          seamstressMap.set(key, {
            seamstress: repair.assignedTo,
            totalRepairs: 0,
            completedRepairs: 0,
            totalRevenue: 0,
            averageRevenue: 0,
            completionRate: 0});
        }

        const sales = seamstressMap.get(key)!;
        sales.totalRepairs++;
        
        if (repair.repairStatus.name === RepairStatusEnum.IN_VALIDATION || repair.repairStatus.name === RepairStatusEnum.DELIVERED) {
          sales.completedRepairs++;
          sales.totalRevenue += this.getRepairRevenue(repair);
        }
      }
    });

    // Calculate averages and completion rates
    seamstressMap.forEach(sales => {
      sales.averageRevenue = sales.completedRepairs > 0 
        ? sales.totalRevenue / sales.completedRepairs 
        : 0;

      sales.completionRate = sales.totalRepairs > 0
        ? (sales.completedRepairs / sales.totalRepairs) * 100
        : 0;});

    this.seamstressSales = Array.from(seamstressMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private createCharts(): void {
    this.destroyCharts();

    this.createStatusChart();
    this.createTypeChart();
    this.createRevenueChart();
  }

  private destroyCharts(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }

    if (this.typeChart) {
      this.typeChart.destroy();
      this.typeChart = null;
    }

    if (this.revenueChart) {
      this.revenueChart.destroy();
      this.revenueChart = null;
    }
  }

  private createStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;

    if (!canvas) return;

    const statusCounts = this.getStatusCounts();

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: [
            '#FFA726',
            '#42A5F5',
            '#66BB6A',
            '#26C6DA',
            '#EF5350']}]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Reparaciones por Estado'}}
      }
    };

    this.statusChart = new Chart(canvas, config);
  }

  private createTypeChart(): void {
    const canvas = document.getElementById('typeChart') as HTMLCanvasElement;

    if (!canvas) return;

    const typeCounts = this.getTypeCounts();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          label: 'Cantidad',
          data: Object.values(typeCounts),
          backgroundColor: '#42A5F5'}]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Reparaciones por Tipo'
          }},
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }}
      }
    };

    this.typeChart = new Chart(canvas, config);
  }

  private createRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;

    if (!canvas) return;

    const revenueByType = this.getRevenueByType();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: Object.keys(revenueByType),
        datasets: [{
          label: 'Ingresos ($)',
          data: Object.values(revenueByType),
          backgroundColor: '#66BB6A'}]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false},
          title: {
            display: true,
            text: 'Ingresos por Tipo de Reparación'}
        },
        scales: {
          y: {
            beginAtZero: true}
        }
      }
    };

    this.revenueChart = new Chart(canvas, config);
  }

  private getStatusCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};

    Object.values(RepairStatusEnum).forEach(status => {
      counts[status] = this.filteredRepairs.filter(r => r.repairStatus.name === status).length;
    });

    return counts;
  }

  private getTypeCounts(): { [key: string]: number } {
    return this.filteredRepairs.reduce((counts, repair) => {
      const items = repair.items ?? [];

      if (items.length === 0) {
        counts['Sin tipo'] = (counts['Sin tipo'] || 0) + 1;

        return counts;
      }

      items.forEach(item => {
        const typeName = item.repairType?.name || 'Sin tipo';
        counts[typeName] = (counts[typeName] || 0) + 1;
      });

      return counts;
    }, {} as { [key: string]: number });
  }

  private getRevenueByType(): { [key: string]: number } {
    return this.filteredRepairs.reduce((revenue, repair) => {
      const items = repair.items ?? [];

      if (items.length === 0) {
        const fallbackType = 'Sin tipo';

        revenue[fallbackType] = (revenue[fallbackType] || 0) + this.getRepairRevenue(repair);
        return revenue;
      }

      items.forEach(item => {
        const typeName = item.repairType?.name || 'Sin tipo';
        const itemRevenue = this.toFiniteNumber(item.finalPrice ?? item.estimatedPrice ?? 0);

        revenue[typeName] = (revenue[typeName] || 0) + itemRevenue;
      });

      return revenue;
    }, {} as { [key: string]: number });
  }

  getRepairTypeLabel(repair: Repair): string {
    const items = repair.items ?? [];
    const typeNames = items
      .map(item => item.repairType?.name)
      .filter((name): name is string => !!name);

    if (typeNames.length === 0) {
      return 'Sin tipo';
    }

    return Array.from(new Set(typeNames)).join(', ');
  }

  private getRepairRevenue(repair: Repair): number {
    return this.toFiniteNumber(repair.finalPrice ?? repair.estimatedPrice ?? 0);
  }

  private toFiniteNumber(value: unknown): number {
    const numericValue = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseInputDate(value: string, endOfDay = false): Date {
    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
      const fallback = new Date(value);

      if (endOfDay) fallback.setHours(23, 59, 59, 999);
      
      return fallback;
    }

    if (endOfDay) {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }

    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
}
