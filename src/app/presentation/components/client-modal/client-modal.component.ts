import { Component, EventEmitter, Output, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientRepository } from '../../../data/repositories/client.repository';
import { Client } from '../../../core/models/client.model';
import { DateFormatDirective } from '../../../shared/directives/date-format.directive';

@Component({
  selector: 'app-client-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DateFormatDirective],
  templateUrl: './client-modal.component.html',
  styleUrls: ['./client-modal.component.scss']
})

export class ClientModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() phoneNumber = '';
  @Output() close = new EventEmitter<void>();
  @Output() clientCreated = new EventEmitter<Client>();

  clientForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private clientRepository: ClientRepository
  ) {}

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      fullName: ['', Validators.required],
      address: ['', Validators.required],
      personalPhone: [this.phoneNumber, [Validators.required, Validators.pattern(/^\d{10}$/)]],
      contactPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      facebook: [''],
      instagram: [''],
      birthDate: ['']
    });
  }

  ngOnChanges(): void {
    if (this.clientForm && this.phoneNumber) {
      this.clientForm.patchValue({ personalPhone: this.phoneNumber });
    }
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const clientData = {
      ...this.clientForm.value,
      birthDate: this.clientForm.value.birthDate ? new Date(this.clientForm.value.birthDate) : undefined
    };

    this.clientRepository.create(clientData).subscribe({
      next: (client) => {
        this.isLoading = false;
        this.clientCreated.emit(client);
        this.resetForm();},
      error: (error) => {
        this.errorMessage = error.message || 'Error al crear el cliente. Intente nuevamente.';
        this.isLoading = false;}});
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  private resetForm(): void {
    this.clientForm.reset({ personalPhone: '' });
    this.errorMessage = '';
  }
}
