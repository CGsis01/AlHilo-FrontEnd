import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unassign-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unassign-confirm-modal.component.html',
  styleUrls: ['./unassign-confirm-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnassignConfirmModalComponent {
  @Input() open = false;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
