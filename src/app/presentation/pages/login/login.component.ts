import { Component, OnInit, OnDestroy, signal, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoleCode } from '../../../core/models/user.model';
import { FingerprintService } from '../../../core/services/fingerprint-reader.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit, OnDestroy {
  readonly fingerprintBusy = signal(false);

  loginForm!: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private injector: Injector,
    // private fingerprintService: FingerprintService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.waitFingerprintLogin();
  }

  ngOnDestroy(): void {
    const fingerprintService =  this.injector.get(FingerprintService);
    fingerprintService.stopCapture().catch(console.error);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        if (response.user.role.code === UserRoleCode.SEAMSTRESS || response.user.role.code === UserRoleCode.HEADSEWING) {
          this.router.navigate(['/repairs']);
        } else {
          this.router.navigate(['/dashboard']);
        }},
      error: (error) => {
        this.errorMessage = error.message || 'Login failed. Please try again.';
        this.isLoading.set(false);}});
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  private async waitFingerprintLogin() {
    const fingerprintService = this.injector.get(FingerprintService);

    while (!this.authService.isAuthenticated()) {
      try {
        const sample = await fingerprintService.captureOnePng();

        this.authService.fingerprintLogin(sample).subscribe({
        next: response => {
          if (response.user.role.code === UserRoleCode.SEAMSTRESS || response.user.role.code === UserRoleCode.HEADSEWING) {
            this.router.navigate(['/repairs']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          this.errorMessage = 'Huella no reconocida';
          this.fingerprintBusy.set(false);
        }});
      } catch {
        // continuar escuchando
      }
    }
  }
}
