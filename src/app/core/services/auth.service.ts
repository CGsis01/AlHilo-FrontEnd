import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse, UserRoleCode } from '../models/user.model';
import { AuthApiService } from './auth-api.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authApiService: AuthApiService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const loginObservable = this.authApiService.login(email, password);

    return loginObservable.pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Login error:', error);
        throw error;}));
  }

  fingerprintLogin(fingerprintData: string): Observable<AuthResponse> {
    const loginObservable = this.authApiService.fingerprintLogin(fingerprintData);

    return loginObservable.pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Fingerprint login error:', error);
        throw error;}));
  }

  logout(message?: string): void {
    this.clearAuthData();
    
    if (message) {
      this.toastService.show(message, 'error');
    }
    
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(environment.refreshTokenKey);
    
    if (!refreshToken) {
      this.logout();
      
      throw new Error('No refresh token available');
    }

    const refreshObservable = this.authApiService.refreshToken(refreshToken);

    return refreshObservable.pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.logout();
        throw error;}));
  }

  getCurrentUser(): Observable<User> {
    return this.authApiService.getCurrentUser().pipe(
      tap(user => {
        localStorage.setItem(environment.userKey, JSON.stringify(user));
        this.currentUserSubject.next(user);}));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.authApiService.changePassword(oldPassword, newPassword);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && this.isValidToken(localStorage.getItem(environment.tokenKey));
  }

  hasRole(role: UserRoleCode): boolean {
    return this.currentUser?.role.code === role;
  }

  hasAnyRole(roles: UserRoleCode[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    if (!response?.token?.accessToken || !response?.token?.refreshToken) {
      throw new Error('Invalid authentication response: missing tokens');
    }

    localStorage.setItem(environment.tokenKey, response.token.accessToken);
    localStorage.setItem(environment.refreshTokenKey, response.token.refreshToken);
    localStorage.setItem(environment.userKey, JSON.stringify(response.user));

    this.currentUserSubject.next(response.user);
    
    this.scheduleTokenExpiry();
  }

  private clearAuthData(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;}

    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem(environment.userKey);
    
    this.currentUserSubject.next(null);
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(environment.userKey);
    const token = localStorage.getItem(environment.tokenKey);
    
    if (userJson && this.isValidToken(token)) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUserSubject.next(user);
        this.scheduleTokenExpiry();
      } catch (error) {
        console.error('Error loading user from storage:', error);
        
        this.clearAuthData();
      }
    } else if (userJson || token) {
      this.clearAuthData();
    }
  }

  /** Schedules a silent token refresh 60 s before expiry, or immediate logout if already close. */
  private scheduleTokenExpiry(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }

    const token = localStorage.getItem(environment.tokenKey);
    if (!token) return;

    const expiry = this.getTokenExpiry(token);
    if (!expiry) return;

    const msUntilExpiry = expiry - Date.now();

    if (msUntilExpiry <= 0) {
      this.logout('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
      
      return;
    }

    // Fire 60 s before expiry; if less than 60 s remain, fire immediately
    const refreshIn = Math.max(msUntilExpiry - 60_000, 0);

    this.expiryTimer = setTimeout(() => {
      const refreshToken = localStorage.getItem(environment.refreshTokenKey);
      
      if (refreshToken) {
        this.refreshToken().subscribe({
          error: () => this.logout('Tu sesión ha expirado. Por favor inicia sesión de nuevo.')
        });
      } else {
        this.logout('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
      }
    }, refreshIn);
  }

  /** Decodes a JWT and returns the expiry timestamp in milliseconds, or null if unavailable. */
  private getTokenExpiry(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private isValidToken(token: string | null): token is string {
    if (!token || token === 'undefined' || token === 'null') return false;
    
    const expiry = this.getTokenExpiry(token);
    
    if (expiry !== null && expiry <= Date.now()) return false;
    
    return true;
  }
}
