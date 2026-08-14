import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Payment } from '../../core/models/payment.model';
import { PaymentRepository } from '../../data/repositories/payment.repository';

@Injectable({
  providedIn: 'root'
})

export class PaymentUseCases {
  constructor(private paymentRepository: PaymentRepository) {}

  createPayment(payment: Partial<Payment>): Observable<Payment> {
    return this.paymentRepository.create(payment);
  }

  getAllPayments(): Observable<Payment[]> {
    return this.paymentRepository.getAll();
  }

  uploadAdvancePaymentPdf(repairId: string, pdf: Blob): Observable<string> {
    return this.paymentRepository.uploadAdvancePaymentPdf(repairId, pdf);
  }

  saveAdvancePaymentPdfUrl(repairId: string, pdfUrl: string): Observable<void> {
    return this.paymentRepository.saveAdvancePaymentPdfUrl(repairId, pdfUrl);
  }

  uploadFinalPaymentPdf(repairId: string, pdf: Blob): Observable<string> {
    return this.paymentRepository.uploadFinalPaymentPdf(repairId, pdf);
  }
  
  saveFinalPaymentPdfUrl(repairId: string, pdfUrl: string): Observable<void> {
    return this.paymentRepository.saveFinalPaymentPdfUrl(repairId, pdfUrl);
  }
}
