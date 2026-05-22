import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { User } from '@core/models/user.model';
import { Payment } from '@core/models/payment.model';

export interface CreatePaymentRequest {
  repair_id: string;
  payment_type_id: string;
  amount: number;
  is_debit: boolean;
  voucher_id?: string;
  is_advance?: boolean;
  created_by: string;
}

export interface PaymentFilters {
  repair_id?: string;
  client_id?: string;  
  date_from?: string;  // ISO date string
  date_to?: string;  // ISO date string
}

@Injectable({
  providedIn: 'root'
})

export class PaymentApiService {
  private readonly endpoint = '/payments';

  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  getAll(filters?: PaymentFilters): Observable<Payment[]> {
    let params = this.buildFilterParams(filters);

    return this.apiService.get<Payment[]>(this.endpoint, params)
    .pipe(map(response => response.map(r => this.mapPayment(r))));
  }

  create(repairData: CreatePaymentRequest): Observable<Payment> {
    return this.apiService.post<Payment>(this.endpoint, repairData)
    .pipe(map(r => this.mapPayment(r)));
  }

  private buildFilterParams(filters?: PaymentFilters): HttpParams {
    let params = new HttpParams();

    if (filters) {
      if (filters.repair_id) params = params.set('repair_id', filters.repair_id);
      if (filters.client_id) params = params.set('client_id', filters.client_id);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
    }

    return params;
  }

  uploadAdvancePaymentPdf(repairId: string, pdf: Blob): Observable<void> {
    const token = localStorage.getItem(environment.tokenKey);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`});

    const formData = new FormData();
    formData.append('file', pdf, 'advance-payment.pdf');

    console.log("form data", headers)
    console.log("Token" ,token)
    console.log("Id de orden " ,repairId )

    return this.http.post<void>(
      `${environment.apiUrl}${this.endpoint}/${repairId}/Alhilo/anticipo.pdf`,
      formData,
      { headers }
    );
  }

  saveAdvancePaymentPdfUrl(repairId: string, pdfUrl: string): Observable<void> {
    return this.apiService.post<void>(
      `${this.endpoint}/${repairId}/Alhilo/anticipo.pdf`,
      { pdf_url: pdfUrl }
    );
  }

  uploadFinalPaymentPdf(repairId: string, pdf: Blob): Observable<void> {
    const token = localStorage.getItem(environment.tokenKey);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}`});
    
    const formData = new FormData();
    formData.append('file', pdf, 'final-payment.pdf');
    console.log("ide de ticket final", repairId)
    console.log("Token" ,token)
    console.log("Id de orden " ,repairId )

    return this.http.post<void>(
      `${environment.apiUrl}${this.endpoint}/${repairId}/Alhilo/pago-completo.pdf`,
      formData,
      { headers }
    );
  }

  saveFinalPaymentPdfUrl(repairId: string, pdfUrl: string): Observable<void> {
    return this.apiService.post<void>(
      `${this.endpoint}/${repairId}/Alhilo/pago-completo  .pdf`,
      { pdf_url: pdfUrl }
    );
  }

  private mapPayment(payment: any): Payment {
    const repair = {
      id: payment.repair.id,
      customerName: payment.repair.customer_name,
      customerPhone: payment.repair.customer_phone,
      customerEmail: payment.repair.customer_email,
      customerId: payment.repair.client_id,
      repairStatus: {
        id: payment.repair.repair_status.repair_status_id,
        name: payment.repair.repair_status.name
      },
      estimatedPrice: 0.00,
      advancePayment: payment.repair.advance_payment,
      isExpress: payment.repair.is_express ?? false,
      finalPrice: undefined,
      assignedTo: payment.repair.assigned_to ? <User>{
        id: payment.repair.assigned_to.user_id,
        name: payment.repair.assigned_to.name
      } : undefined,
      createdBy: <User>{
        id: payment.repair.created_by_user.id,
        name: payment.repair.created_by_user.name,
        email: payment.repair.created_by_user.email,
        role: payment.repair.created_by_user.role
      },
      receivedDate: new Date(payment.repair.received_date),
      estimatedDeliveryDate: new Date(payment.repair.estimated_delivery_date),
      actualDeliveryDate: payment.repair.actual_delivery_date ? new Date(payment.repair.actual_delivery_date) : undefined,
      notes: payment.repair.notes,
      items: undefined,
      createdAt: new Date(payment.repair.created_at),
      updatedAt: new Date(payment.repair.updated_at)
    };

    return {
      id: payment.id,
      repair: repair,
      paymentType: payment.paymentType,
      amount: payment.amount,
      isDebit: payment.isDebit,
      voucherId: payment.voucherId,
      isAdvance: payment.isAdvance,
      createdBy: payment.createdBy,
      paymentDate: new Date(payment.paymentDate)
    };
  }
}
