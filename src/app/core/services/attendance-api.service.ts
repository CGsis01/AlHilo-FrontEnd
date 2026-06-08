import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { AttendanceCreate, AttendanceResponse, AttendanceClockOut } from '../models/attendance.model';

interface AttendanceApiResponse {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  ip_address?: string;
  device_info?: string;
}

@Injectable({
  providedIn: 'root'
})

export class AttendanceApiService {

  constructor(private apiService: ApiService) {}

  clockIn(attendanceData: AttendanceCreate): Observable<AttendanceResponse> {
    return this.apiService.post<AttendanceApiResponse>('/attendance/clock-in', attendanceData).pipe(
      map(attendance => this.mapAttendanceResponse(attendance))
    );
  }

  clockOut(attendanceClockOutData: AttendanceClockOut): Observable<AttendanceResponse> {
    return this.apiService.post<AttendanceApiResponse>('/attendance/clock-out', attendanceClockOutData).pipe(
      map(attendance => this.mapAttendanceResponse(attendance))
    );
  }

  getAttendanceHistory(filters?: {
    userId: string | null;
    attendanceDate: string | null;
    startDate: string | null;
    endDate: string | null;
    skip?: number;
    limit?: number;
  }): Observable<AttendanceResponse[]> {
    let params = new HttpParams();

    if (filters?.userId) {
      params = params.set('user_id', filters.userId);
    }

    if (filters?.attendanceDate) {
      params = params.set('attendance_date', filters.attendanceDate);
    }

    if (filters?.startDate) {
      params = params.set('start_date', filters.startDate);
    }

    if (filters?.endDate) {
      params = params.set('end_date', filters.endDate);
    }
    if (filters?.skip) {
      params = params.set('skip', filters.skip.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    return this.apiService.get<AttendanceApiResponse[]>('/attendance/history', params).pipe(
      map(attendances => attendances.map(attendance => this.mapAttendanceResponse(attendance)))
    );
  }

  private mapAttendanceResponse(attendance: AttendanceApiResponse): AttendanceResponse {
    return {
      id: attendance.id,
      userId: attendance.user_id,
      clockIn: this.parseApiDate(attendance.clock_in) ?? attendance.clock_in,
      clockOut: attendance.clock_out ? this.parseApiDate(attendance.clock_out) ?? attendance.clock_out : undefined,
      ipAddress: attendance.ip_address,
      deviceInfo: attendance.device_info,
    };
  }

  private parseApiDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    let normalized = value.trim().replace(' ', 'T');
    normalized = normalized.replace(/\.(\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})?$)/, '.$1');

    if (!/(Z|[+-]\d{2}:\d{2})$/.test(normalized)) {
      normalized = `${normalized}Z`;
    }

    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}