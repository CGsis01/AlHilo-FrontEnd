import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/user.model';
import { CashCutResponse } from '../../../core/models/cashcut.model';

@Component({
  selector: 'app-cash-cut-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cash-cut-ticket.component.html',
  styleUrls: ['./cash-cut-ticket.component.scss']
})

export class CashCutTicketComponent {
  @Input() cashCut!: CashCutResponse | null;
  @Input() currentUser!: User | null;
  @Output() close = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();

  currentDate = new Date();

  closeCashCutTicket(): void {
    this.close.emit();
  }

  printCashCutTicket(): void {
    this.print.emit();
  }
}