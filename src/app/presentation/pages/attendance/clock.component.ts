import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AttendanceResponse } from '../../../core/models/attendance.model';
import { User } from '../../../core/models/user.model';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { FingerprintService } from '../../../core/services/fingerprint-reader.service';
import { interval, Subscription } from 'rxjs';
import * as XLSX from 'xlsx';

interface AttendanceExportSummaryRow {
  userId: string;
  userName: string;
  dayKey: string;
  dayLabel: string;
  totalMs: number;
}

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clock.component.html',
  styleUrls: ['./clock.component.scss']
})

export class ClockComponent implements OnInit, OnDestroy {
  readonly fingerprintConnected = signal(false);
  readonly waitingFingerprint = signal(false);

  currentAttendance: AttendanceResponse | null = null;
  recentSessions: AttendanceResponse[] = [];
  currentTime = '';
  isLoading = signal(false);
  isFingerprintScanning = signal(false);

  users: User[] = [];
  selectedUserId = '';
  fingerprintData = '';
  errorMessage = '';
  infoMessage = '';

  now = new Date();
  selectedDate?: string;
  startDate?: string;
  endDate?: string;

  private timeSubscription?: Subscription;
  private attendanceSubscription?: Subscription;

  constructor(
    private attendanceService: AttendanceService,
    private userApiService: UserApiService,
    private authService: AuthService,
    private fingerprintService: FingerprintService
  ) {}

  ngOnInit(): void {
    this.updateCurrentTime();
    this.loadCurrentAttendance();
    this.loadRecentSessions();
    this.loadUsers();
    this.initializeFingerprintClock();

    // Update time every second
    this.timeSubscription = interval(1000).subscribe(() => {
      this.now = new Date();
      this.updateCurrentTime();

      this.recentSessions = [...this.recentSessions];
    });
  }

  ngOnDestroy(): void {
    this.timeSubscription?.unsubscribe();
    this.attendanceSubscription?.unsubscribe();
  }

  handleClockAction(): void {
    if (!this.selectedUserId) {
      this.errorMessage = 'Selecciona un usuario antes de registrar asistencia.';
      
      return;
    }

    if (!this.fingerprintData.trim()) {
      this.errorMessage = 'Ingresa o captura la huella para continuar.';
      
      return;
    }

    this.errorMessage = '';
    this.infoMessage = '';
    this.isFingerprintScanning.set(true);

    this.authService.fingerprintLogin(this.fingerprintData.trim()).subscribe({
      next: (authResponse) => {
        this.isFingerprintScanning.set(false);

        this.infoMessage = `Huella verificada para ${authResponse.user.name}.`;

        if (this.currentAttendance) {
          this.clockOut();
        } else {
          this.clockIn();
        }
      },
      error: (error) => {
        this.isFingerprintScanning.set(false);
        console.error('Fingerprint login error:', error);
        this.errorMessage = error.message || 'No se pudo validar la huella.';
      }
    });
  }

  onUserSelectionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    
    this.selectedUserId = target.value;
    this.errorMessage = '';
    this.infoMessage = '';

    this.loadRecentSessions(this.selectedUserId);
  }

  onFingerprintDataChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    
    this.fingerprintData = target.value;
    this.errorMessage = '';
  }

  getSelectedUserName(): string {
    return this.users.find(user => user.id === this.selectedUserId)?.name || 'Sin usuario';
  }

  private loadUsers(): void {
    this.userApiService.getAll({ is_active: true }).subscribe({
      next: (users) => { this.users = users; },
      error: () => { this.errorMessage = 'No se pudo cargar la lista de usuarios.'; }});
  }

  private clockIn(): void {
    this.isLoading.set(true);

    const attendanceData = {
      user_id: this.selectedUserId,
      clock_in: new Date().toISOString(),
      ip_address: '', // You can implement a method to get the user's IP if needed
      device_info: navigator.userAgent
    };

    this.attendanceService.clockIn(attendanceData).subscribe({
      next: (attendance) => {
        this.currentAttendance = attendance;
        
        // Refresh the list to show the new session
        this.loadRecentSessions(); },
      error: (error) => { console.error('Clock in error:', error); }
    });

    this.isLoading.set(false);
  }

  private clockOut(): void {
    if (!this.currentAttendance) return;

    this.isLoading.set(true);

    const attendanceClockOutData = {
      user_id: this.selectedUserId,
      attendance_id: this.currentAttendance.id,
    };

    this.attendanceService.clockOut(attendanceClockOutData).subscribe({
      next: () => {
        this.currentAttendance = null;
        
        // Refresh the list to show the updated session
        this.loadRecentSessions(); },
      error: (error) => { console.error('Clock out error:', error); }
    });

    this.isLoading.set(false);
  }

  loadCurrentAttendance(): void {
    this.startDate = undefined;
    this.endDate = undefined;
    this.recentSessions = [];
    this.currentAttendance = null;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.attendanceSubscription = this.attendanceService.getAttendanceHistory(null, today, null, null, 0, 100).subscribe({
      next: (sessions) => {
        const normalizedSessions = sessions.map(session => this.normalizeAttendance(session));
        this.recentSessions = normalizedSessions;
        this.currentAttendance = normalizedSessions.find(session => !session.clockOut) || null;
      },
      error: (error) => {
        console.error('Load current attendance error:', error);
      }
    });
  }

  private loadRecentSessions(userId?: string): void {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.attendanceService.getAttendanceHistory(userId, today, null, null, 0, 100).subscribe({
      next: (sessions) => {
        const normalizedSessions = sessions.map(session => this.normalizeAttendance(session));
        this.recentSessions = normalizedSessions;
        
        if (!userId || !normalizedSessions.some(session => !session.clockOut)) {
          this.currentAttendance = null;
        } else {
          this.currentAttendance = normalizedSessions.find(session => !session.clockOut) || null;
        }
      },
      error: (error) => {
        console.error('Load recent sessions error:', error);
      }
    });
  }

  loadRange(): void {
    if (!this.startDate || !this.endDate) return;

    this.attendanceService.getAttendanceHistory(null, null, this.startDate, this.endDate, 0, 100).subscribe({
      next: (sessions) => {
        this.recentSessions = sessions.map(session => this.normalizeAttendance(session));
      },
      error: (error) => {
        console.error('Load range error:', error);
      }
    });    
  }

  exportAttendanceToExcel(): void {
    if (!this.recentSessions.length) {
      return;
    }

    const workbook = this.buildWorkbook(this.recentSessions);
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = this.getExportFileName();
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private normalizeAttendance(session: AttendanceResponse | any): AttendanceResponse {
    return {
      ...session,
      userId: session.userId ?? session.user_id,
      clockIn: session.clockIn ?? session.clock_in,
      clockOut: session.clockOut ?? session.clock_out ?? undefined,
      ipAddress: session.ipAddress ?? session.ip_address,
      deviceInfo: session.deviceInfo ?? session.device_info,
    };
  }

  getSessionUserName(session: AttendanceResponse): string {
    const matchedUser = this.users.find(user => user.id === session.userId);

    return matchedUser?.name || 'Usuario no disponible';
  }

  private buildWorkbook(sessions: AttendanceResponse[]): XLSX.WorkBook {
    const generatedAt = new Date().toLocaleString('es-ES');
    const summaryRows = this.buildAttendanceSummaryRows(sessions);
    const detailRows = this.sortAttendanceSessionsForExport(sessions);

    const worksheetData: (string | number)[][] = [
      ['Asistencias'],
      [`Generado: ${generatedAt}`],
      [],
      ['Concentrado de horas por empleado y día'],
      ['Empleado', 'Día', 'Horas'],
    ];

    summaryRows.forEach(row => {
      worksheetData.push([
        row.userName,
        row.dayLabel,
        this.formatDuration(row.totalMs),
      ]);
    });

    worksheetData.push([]);
    worksheetData.push(['Detalle por día']);
    worksheetData.push(['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas']);

    detailRows.forEach(session => {
      worksheetData.push([
        this.getSessionUserName(session),
        this.formatDate(session.clockIn),
        this.formatTime(session.clockIn),
        session.clockOut ? this.formatTime(session.clockOut) : '—',
        this.getSessionDuration(session),
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

    return workbook;
  }

  private buildAttendanceSummaryRows(sessions: AttendanceResponse[]): AttendanceExportSummaryRow[] {
    const groupedRows = new Map<string, AttendanceExportSummaryRow>();

    sessions.forEach(session => {
      const sessionDate = this.parseDate(session.clockIn);
      if (!sessionDate) return;

      const dayKey = this.getLocalDayKey(sessionDate);
      const groupKey = `${session.userId}|${dayKey}`;
      const currentRow = groupedRows.get(groupKey);
      const sessionHours = this.getSessionDurationMs(session);
      const userName = this.getSessionUserName(session);

      if (currentRow) {
        currentRow.totalMs += sessionHours;
        return;
      }

      groupedRows.set(groupKey, {
        userId: session.userId,
        userName,
        dayKey,
        dayLabel: this.formatDate(sessionDate),
        totalMs: sessionHours,
      });
    });

    return [...groupedRows.values()].sort((left, right) => {
      const userComparison = left.userName.localeCompare(right.userName, 'es');
      if (userComparison !== 0) return userComparison;

      return left.dayKey.localeCompare(right.dayKey);
    });
  }

  private sortAttendanceSessionsForExport(sessions: AttendanceResponse[]): AttendanceResponse[] {
    return [...sessions].sort((left, right) => {
      const leftDate = this.parseDate(left.clockIn)?.getTime() ?? 0;
      const rightDate = this.parseDate(right.clockIn)?.getTime() ?? 0;

      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      const userComparison = this.getSessionUserName(left).localeCompare(this.getSessionUserName(right), 'es');
      if (userComparison !== 0) return userComparison;

      return String(left.clockIn).localeCompare(String(right.clockIn));
    });
  }

  private getLocalDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getExportFileName(): string {
    const now = new Date();
    const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (this.startDate && this.endDate) {
      return `asistencias_${this.startDate}_a_${this.endDate}.xlsx`;
    }

    if (this.selectedUserId) {
      const userName = this.getSelectedUserName()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'usuario';

      return `asistencias_${userName}_${dateStamp}.xlsx`;
    }

    return `asistencias_${dateStamp}.xlsx`;
  }

  private updateCurrentTime(): void {
    const now = new Date();
    
    this.currentTime = now.toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getStatusTitle(): string {
    return this.currentAttendance ? 'Actualmente Trabajando' : 'No Registrado';
  }

  getStatusMessage(): string {
    if (this.currentAttendance)
      return `Has registrado tu entrada a las ${this.formatTime(this.currentAttendance.clockIn)}`;

    return 'Haz clic en el botón de abajo para iniciar tu sesión de trabajo';
  }

  getButtonText(): string {
    if (this.isLoading() || this.isFingerprintScanning())
      return 'Validando huella...';

    return this.currentAttendance ? 'Registrar Salida' : 'Registrar Entrada';
  }

  getButtonClasses(): string {
    if (this.currentAttendance) {
      return 'clock-out';
    }
    return 'clock-in';
  }

  getStatusClasses(): string {
    return this.currentAttendance
      ? 'bg-green-100 border-4 border-green-300'
      : 'bg-gray-100 border-4 border-gray-300';
  }

  private parseDate(date: Date | string | null | undefined): Date | null {
    if (!date) {
      return null;
    }

    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : new Date(date.getTime());
    }

    let normalizedDate = date.trim().replace(' ', 'T');
    normalizedDate = normalizedDate.replace(/\.(\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})?$)/, '.$1');

    if (!/(Z|[+-]\d{2}:\d{2})$/.test(normalizedDate)) {
      normalizedDate = `${normalizedDate}Z`;
    }

    const parsedDate = new Date(normalizedDate);

    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  formatTime(date: Date | string): string {
    const d = this.parseDate(date);
    if (!d) return '--:--';

    return d.toLocaleTimeString('es-ES', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: Date | string): string {
    const d = this.parseDate(date);
    if (!d) return 'Fecha no disponible';
    
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  getCurrentDuration(): string {
    if (!this.currentAttendance) return '00:00:00';

    return this.formatDuration(this.getSessionDurationMs(this.currentAttendance));
  }

  getSessionDuration(session: AttendanceResponse): string {
    return this.formatDuration(this.getSessionDurationMs(session));
  }

  private getSessionDurationMs(session: AttendanceResponse): number {
    const start = this.parseDate(session.clockIn);
    const end = session.clockOut ? this.parseDate(session.clockOut) : this.now;
    if (!start || !end) return 0;

    return Math.max(end.getTime() - start.getTime(), 0);
  }

  private formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getTodaysHours(): string {
    // Calculate today's total hours from recent sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalMs = 0;
    this.recentSessions.forEach(session => {
      const sessionDate = this.parseDate(session.clockIn);
      if (!sessionDate) return;

      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === today.getTime()) {
        totalMs += this.getSessionDurationMs(session);
      }
    });

    return this.formatDuration(totalMs);
  }

  getWeeklyHours(): string {
    // Calculate this week's total hours
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let totalMs = 0;
    this.recentSessions.forEach(session => {
      const sessionDate = this.parseDate(session.clockIn);
      if (!sessionDate) return;

      if (sessionDate >= startOfWeek) {
        totalMs += this.getSessionDurationMs(session);
      }
    });

    return this.formatDuration(totalMs);
  }

  getMonthlyHours(): string {
    // Calculate this month's total hours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalMs = 0;
    this.recentSessions.forEach(session => {
      const sessionDate = this.parseDate(session.clockIn);
      if (!sessionDate) return;

      if (sessionDate >= startOfMonth) {
        totalMs += this.getSessionDurationMs(session);
      }
    });

    return this.formatDuration(totalMs);
  }

  private initializeFingerprintClock(): void {
    this.fingerprintService.onDeviceStatus().subscribe(status => {
      this.fingerprintConnected.set(status === 'connected');
    });

    this.waitForFingerprint();
  }

  private async waitForFingerprint(): Promise<void> {
    while (true) {
      try {
        this.waitingFingerprint.set(true);

        const sample = await this.fingerprintService.captureOnePng();
        
        this.waitingFingerprint.set(false);

        await this.processFingerprint(sample);

      } catch (error) {
        console.error(error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async processFingerprint(sample: string): Promise<void> {
    if (this.isFingerprintScanning()) {
      return;
    }

    this.isFingerprintScanning.set(true);

    this.authService.fingerprintLogin(sample).subscribe({
        next: authResponse => {
          const user = authResponse.user;

          this.infoMessage = `Huella reconocida: ${user.name}`;

          this.registerAttendance(user.id);
        },
        error: () => {
          this.errorMessage = 'Huella no reconocida';
          this.isFingerprintScanning.set(false);
        }});
  }

  private registerAttendance(userId: string): void {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.attendanceService.getAttendanceHistory(userId, today, null, null, 0, 100).subscribe({
      next: sessions => {
        const active = sessions.find(x => !x.clockOut);

        if (active) {
          this.attendanceService.clockOut({ user_id: userId, attendance_id: active.id}).subscribe({
            next: () => {
              this.infoMessage = 'Salida registrada';
              this.loadRecentSessions();
              this.isFingerprintScanning.set(false);
            }});
        } else {
          this.attendanceService.clockIn({ user_id: userId, clock_in: new Date().toISOString(), device_info: navigator.userAgent}).subscribe({
            next: () => {
              this.infoMessage = 'Entrada registrada';
              this.loadRecentSessions();
              this.isFingerprintScanning.set(false);}});
        }
      }});
  }
}
