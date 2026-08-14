import { Component, EventEmitter, Output, Input, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientRepository } from '../../../data/repositories/client.repository';
import { Client } from '../../../core/models/client.model';

@Component({
  selector: 'app-client-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-modal.component.html',
  styleUrls: ['./client-modal.component.scss']
})

export class ClientModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() phoneNumber = '';
  @Output() close = new EventEmitter<void>();
  @Output() clientCreated = new EventEmitter<Client>();

  clientForm!: FormGroup;
  
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private clientRepository: ClientRepository
  ) {}

  ngOnInit(): void {
    this.clientForm = this.fb.group({
      fullName: ['', Validators.required],
      // address: ['', Validators.required],
      personalPhone: [this.phoneNumber, [Validators.required, Validators.pattern(/^\d{10}$/)]],
      // contactPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      // email: ['', [Validators.email]],
      // facebook: [''],
      // instagram: [''],
      // birthDate: ['']
    });
  }

  ngOnChanges(): void {
    if (this.clientForm && this.phoneNumber) {
      this.clientForm.patchValue({ personalPhone: this.phoneNumber });
    }
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.errorMessage.set('Favor de llenar todos los campos requeridos correctamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const clientData = {
      ...this.clientForm.value,
      // contactPhone: this.clientForm.value.contactPhone?.trim() || '',
      // Backend currently requires address, so we provide a safe default.
      address: 'No especificada'
    };

    this.clientRepository.create(clientData).subscribe({
      next: (client) => {
        this.clientCreated.emit(client);
        this.resetForm();},
      error: (error) => {
        this.errorMessage.set(error.message || 'Error al crear el cliente. Intente nuevamente.');
        }});

    this.isLoading.set(false);
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
    this.clientForm.reset({ personalPhone: this.phoneNumber, contactPhone: '' });
    this.errorMessage.set('');
  }
}
