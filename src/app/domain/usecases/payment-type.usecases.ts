import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentTypeRepository } from '../../data/repositories/payment-type.repository';
import { PaymentType } from '@core/models/payment-type.model';

@Injectable({
  providedIn: 'root'
})

export class PaymentTypeUseCases {
  constructor(private paymentTypeRepository: PaymentTypeRepository) {}

  getAllPaymentTypes(): Observable<PaymentType[]> {
    return this.paymentTypeRepository.getAll();
  }
}
