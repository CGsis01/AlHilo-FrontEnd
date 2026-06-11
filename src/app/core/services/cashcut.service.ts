import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CashCutResponse } from '../models/cashcut.model';
import { CashCutApiService } from './cashcut-api.service';

@Injectable({
  providedIn: 'root'
})

export class CashCutService {
    constructor(private cashCutApiService: CashCutApiService) { }

    getCashCut(cash_cut_date: string): Observable<CashCutResponse> {
        return this.cashCutApiService.getCashCut(cash_cut_date);
    }
}