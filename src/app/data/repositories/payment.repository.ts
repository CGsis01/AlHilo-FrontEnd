import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';
import { Payment } from '@core/models/payment.model';
import { PaymentApiService } from '../../core/services/payment-api.service';

@Injectable({
  providedIn: 'root'
})

export class PaymentRepository {
  constructor(private paymentApiService: PaymentApiService) {}

  getAll(): Observable<Payment[]> {
    return this.paymentApiService.getAll();
  }

  create(payment: Partial<Payment>): Observable<Payment> {
    // Map Payment model to CreatePaymentRequest
    const createRequest = {
        repair_id: payment.repair?.id!,
        payment_type_id: payment.paymentType?.id!,
        amount: payment.amount!,
        is_debit: payment.isDebit!,
        voucher_id: payment.voucherId,
        is_advance: payment.isAdvance,
        created_by: this.getStoredUserId()};

    return this.paymentApiService.create(createRequest);
  }

  private getStoredUserId(): string {
    const userJson = localStorage.getItem(environment.userKey);
  
    if (!userJson) {
      throw new Error('No user found in local storage');
    }
  
    return (JSON.parse(userJson) as User).id;
  }
}
