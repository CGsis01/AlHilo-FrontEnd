import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentType } from '@core/models/payment-type.model';
import { PaymentTypeApiService } from '../../core/services/payment-type-api.service';

@Injectable({
  providedIn: 'root'
})

export class PaymentTypeRepository {
  constructor(private paymentTypeApiService: PaymentTypeApiService) {}

  getAll(): Observable<PaymentType[]> {
    return this.paymentTypeApiService.getAll();
  }
}
