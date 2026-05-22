import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-selection-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-selection-modal.component.html',
  styleUrls: ['./client-selection-modal.component.scss']
})
export class ClientSelectionModalComponent {
  @Input() isOpen = false;
  @Input() clients: Client[] = [];
  @Input() phoneNumber = '';

  @Output() close = new EventEmitter<void>();
  @Output() clientSelected = new EventEmitter<Client>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  selectClient(client: Client): void {
    this.clientSelected.emit(client);
  }
}