import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-job-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-review-modal.component.html',
  styleUrls: ['./job-review-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobReviewModalComponent {
  @Input() open = false;
  @Input() comment = '';

  @Output() close = new EventEmitter<void>();
  @Output() commentChange = new EventEmitter<string>();
  @Output() confirm = new EventEmitter<void>();
}
