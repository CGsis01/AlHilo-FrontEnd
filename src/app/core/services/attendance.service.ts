import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { AttendanceApiService } from './attendance-api.service';
import { AttendanceClockOut, AttendanceCreate, AttendanceResponse } from '../models/attendance.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})

export class AttendanceService {
  private currentAttendanceSubject = new BehaviorSubject<AttendanceResponse | null>(null);
  public currentAttendance$ = this.currentAttendanceSubject.asObservable();

  constructor(
    private attendanceApiService: AttendanceApiService,
    private toastService: ToastService
  ) {}

  clockIn(attendanceData: AttendanceCreate): Observable<AttendanceResponse> {
    return this.attendanceApiService.clockIn(attendanceData).pipe(
      tap(response => {
        this.currentAttendanceSubject.next(response);
        
        this.toastService.show('Entrada registrada con éxito!', 'success');
      }),
      catchError(error => {
        console.error('Clock in error:', error);
        this.toastService.show('No se pudo registrar la asistencia. Intenta nuevamente.', 'error');
        
        throw error;
      })
    );
  }

  clockOut(attendanceClockOutData: AttendanceClockOut): Observable<AttendanceResponse> {
    return this.attendanceApiService.clockOut(attendanceClockOutData).pipe(
      tap(() => {
        this.currentAttendanceSubject.next(null);
        this.toastService.show('Salida registrada con éxito!', 'success');
      }),
      catchError(error => {
        console.error('Clock out error:', error);
        this.toastService.show('No se pudo registrar la salida. Intenta nuevamente.', 'error');
        throw error;
      })
    );
  }

  getAttendanceHistory(userId: string | null = null, attendanceDate: string | null = null, startDate: string | null = null, endDate: string | null = null, skip: number = 0, limit: number = 100): Observable<AttendanceResponse[]> {
    return this.attendanceApiService.getAttendanceHistory({ userId, attendanceDate, startDate, endDate, skip, limit }).pipe(
      catchError(error => {
        console.error('Get attendance history error:', error);
        this.toastService.show('Failed to load attendance history.', 'error');
        
        throw error;
      })
    );
  }

  setCurrentAttendance(attendance: AttendanceResponse | null): void {
    this.currentAttendanceSubject.next(attendance);
  }

  getCurrentAttendance(): AttendanceResponse | null {
    return this.currentAttendanceSubject.value;
  }
}