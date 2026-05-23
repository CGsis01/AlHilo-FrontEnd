import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  position: ToastPosition;
}

@Injectable({
  providedIn: 'root'
})

export class ToastService {
  private _toasts = new BehaviorSubject<ToastMessage[]>([]);
  toasts$ = this._toasts.asObservable();

  private nextId = 0;

  show(message: string, type: ToastType = 'info', position: ToastPosition = 'bottom-right', durationMs = 4000): void {
    const id = this.nextId++;
    const toast: ToastMessage = { id, message, type, position };
    
    this._toasts.next([...this._toasts.value, toast]);
    
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }
}
