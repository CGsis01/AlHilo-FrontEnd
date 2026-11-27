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
  @Input() selectedPrimarySeamstress: User | null = null;
  @Input() selectedSecondarySeamstress: User | null = null;
  @Input() isPrimaryOptionDisabled: (seamstress: User) => boolean = () => false;
  @Input() isSecondaryOptionDisabled: (seamstress: User) => boolean = () => false;

  @Output() close = new EventEmitter<void>();
  @Output() selectPrimarySeamstress = new EventEmitter<User>();
  @Output() selectSecondarySeamstress = new EventEmitter<User>();
  @Output() assignSeamstress = new EventEmitter<void>();

  getRepairTypeNames(item: RepairItem | null): string {
    const names = (item?.repairTypes ?? []).map(type => type.name).filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Sin tipo';
  }
}
