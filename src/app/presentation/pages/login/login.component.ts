import { Component, OnInit, OnDestroy, signal, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoleCode } from '../../../core/models/user.model';
import { FingerprintService } from '../../../core/services/fingerprint-reader.service';
import { BiometricService } from '../../../core/services/biometric.service';

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
    private biometricService: BiometricService
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
    const fingerprintService = this.injector.get(FingerprintService);
    fingerprintService.stopCapture().catch(console.error);
    fingerprintService.release('login');
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
      if (!fingerprintService.acquire('login')) {
        return;
      }

      try {
        const sample = await fingerprintService.captureOnePng();

        const identifyResult = await firstValueFrom(this.biometricService.identify(sample));

        if (!identifyResult.matchFound) {
          this.errorMessage = 'Huella no reconocida';
          continue;
        }

        const response = await firstValueFrom(this.authService.biometricLogin(identifyResult.userId!));

        if (response.user.role.code === UserRoleCode.SEAMSTRESS || response.user.role.code === UserRoleCode.HEADSEWING) 
        {
          await this.router.navigate(['/repairs']);
        } else {
          await this.router.navigate(['/dashboard']);
        }

        break;
      } catch (error) {
        // continuar escuchando
        this.errorMessage = 'Huella no reconocida';
        console.error('Fingerprint login error', error);

        await new Promise(resolve =>
          setTimeout(resolve, 1000)
        );
      }
      finally {
        fingerprintService.release('login');
      }
    }
  }
}
