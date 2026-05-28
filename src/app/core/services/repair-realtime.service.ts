import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RepairRealtimeEvent } from '../models/repair-realtime-event.model';
import { RepairApiService } from './repair-api.service';

@Injectable({
  providedIn: 'root'
})
export class RepairRealtimeService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = false;
  private token: string | null = null;

  private readonly eventsSubject = new Subject<RepairRealtimeEvent>();
  readonly events$ = this.eventsSubject.asObservable();

  constructor(private repairApiService: RepairApiService) {}

  connect(token: string): void {
    if (!token) {
      return;
    }

    this.token = token;
    this.shouldReconnect = true;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const wsUrl = this.buildWebSocketUrl(token);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (message: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(message.data) as RepairRealtimeEvent & { repair?: unknown };
        const event: RepairRealtimeEvent = {
          ...parsed,
          repair: parsed.repair ? this.repairApiService.normalizeRepair(parsed.repair) : undefined
        };
        this.eventsSubject.next(event);
      } catch (error) {
        console.error('Invalid repair realtime payload:', error);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.eventsSubject.complete();
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || !this.token) {
      return;
    }

    const delay = Math.min(30_000, 1_000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  private buildWebSocketUrl(token: string): string {
    const wsBase = environment.apiUrl
      .replace(/^http:\/\//i, 'ws://')
      .replace(/^https:\/\//i, 'wss://')
      .replace(/\/api\/v1\/?$/, '');

    return `${wsBase}/api/v1/repairs/ws?token=${encodeURIComponent(token)}`;
  }
}
