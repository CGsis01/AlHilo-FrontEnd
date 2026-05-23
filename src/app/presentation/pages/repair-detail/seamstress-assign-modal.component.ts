import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RepairItem } from '@core/models/repair-item.model';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-seamstress-assign-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seamstress-assign-modal.component.html',
  styleUrls: ['./seamstress-assign-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SeamstressAssignModalComponent {
  @Input() open = false;
  @Input() selectedGarmentItem: RepairItem | null = null;
  @Input() isLoadingSeamstresses = false;
  @Input() seamstresses: User[] = [];
  @Input() selectedSeamstress: User | null = null;
  @Input() isSeamstressAlreadyAssigned: (seamstress: User) => boolean = () => false;

  @Output() close = new EventEmitter<void>();
  @Output() openUnassign = new EventEmitter<void>();
  @Output() selectSeamstress = new EventEmitter<User>();
  @Output() assignSeamstress = new EventEmitter<void>();
}
