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

  addAdvancePayment(
  payments: Partial<Payment>[]
): Observable<Payment[]> {

  const createRequest = payments.map(payment => ({
    repair_id: payment.repair?.id!,
    payment_type_id: payment.paymentType?.id!,
    amount: payment.amount!,
    is_debit: payment.isDebit ?? false,
    voucher_id: payment.voucherId,
    is_advance: true,
    created_by: getStoredUserId()
  }));

  return this.paymentApiService.addAdvancePayment(
    createRequest
  );
}

  uploadAdvancePaymentPdf(repairId: string, pdf: Blob): Observable<string> {
    return this.paymentApiService.uploadAdvancePaymentPdf(repairId, pdf);
  }

  saveAdvancePaymentPdfUrl(repairId: string, pdfUrl: string): Observable<void> {
    return this.paymentApiService.saveAdvancePaymentPdfUrl(repairId, pdfUrl);
  }

  uploadFinalPaymentPdf(repairId: string, pdf: Blob): Observable<string> {
    return this.paymentApiService.uploadFinalPaymentPdf(repairId, pdf);
  }

  saveFinalPaymentPdfUrl(repairId: string, pdfUrl: string): Observable<void> {
    return this.paymentApiService.saveFinalPaymentPdfUrl(repairId, pdfUrl);
  }
}
