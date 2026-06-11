import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CashCutResponse } from '../models/cashcut.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})

export class CashCutApiService {
    constructor(private apiService: ApiService) {}

    getCashCut(cash_cut_date: string): Observable<CashCutResponse> {
        return this.apiService.get<CashCutResponse>(`/cash-cut/?cash_cut_date=${cash_cut_date}`);
    }
}