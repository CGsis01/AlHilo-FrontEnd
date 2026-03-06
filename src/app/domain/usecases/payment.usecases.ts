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
}
