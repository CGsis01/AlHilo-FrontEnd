import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { PaymentType } from '@core/models/payment-type.model';

@Injectable({
  providedIn: 'root'
})

export class PaymentTypeApiService {
  private readonly endpoint = '/payment-types';

  constructor(private apiService: ApiService) {}

  getAll(): Observable<PaymentType[]> {
    return this.apiService.get<PaymentType[]>(this.endpoint)
    .pipe(map(response => response.map(pt => this.mapPaymentType(pt))));
  }

  private mapPaymentType(paymentType: any): PaymentType {
    return {
      id: paymentType.id,
      name: paymentType.name,
      code: paymentType.code};
  }
}
