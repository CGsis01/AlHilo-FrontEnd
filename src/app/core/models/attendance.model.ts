export interface Attendance {
  id: string;
  userId: string;
  clockIn: Date | string;
  clockOut?: Date | string;
  ipAddress?: string;
  deviceInfo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceCreate {
  user_id: string;
  clock_in: Date | string;
  ip_address?: string;
  device_info?: string;
}

export interface AttendanceClockOut {
  user_id: string;
  attendance_id: string;
}

export interface AttendanceExportSummaryRow {
  userId: string;
  userName: string;
  dayKey: string;
  dayLabel: string;
  totalMs: number;
}

export interface AttendanceResponse {
  id: string;
  userId: string;
  clockIn: Date | string;
  clockOut?: Date | string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface BiometricLoginRequest {
  user_id: string;
}