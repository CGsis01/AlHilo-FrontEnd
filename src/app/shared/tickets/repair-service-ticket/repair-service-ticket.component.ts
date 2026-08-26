import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GarmentTicketData } from './repair-service.model';

@Component({
  selector: 'app-repair-service-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './repair-service-ticket.component.html',
  styleUrl: './repair-service-ticket.component.scss',
})
export class RepairServiceTicketComponent {
  @Input() data: GarmentTicketData | null = null;
}