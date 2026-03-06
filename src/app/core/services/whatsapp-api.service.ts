import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export type WhatsappEvent = 'received' | 'in_progress' | 'validated';

export interface WhatsappNotificationRequest {
  phone: string;
  customer_name: string;
  repair_id: string;
  event: WhatsappEvent;
}

export interface WhatsappNotificationResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})

export class WhatsappApiService {
  private readonly endpoint = '/whatsapp/send-notification';

  constructor(private apiService: ApiService) {}

  sendNotification(request: WhatsappNotificationRequest): Observable<WhatsappNotificationResponse> {
    return this.apiService.post<WhatsappNotificationResponse>(this.endpoint, request).pipe(
      catchError(() => of({ success: false, message: 'Error al enviar notificación de WhatsApp' })));
  }
}
