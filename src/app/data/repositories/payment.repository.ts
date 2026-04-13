import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Payment } from '@core/models/payment.model';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { getStoredUserId } from '../../shared/utils/userLocalData.utils';

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
        created_by: getStoredUserId()};

    return this.paymentApiService.create(createRequest);
  }
}
