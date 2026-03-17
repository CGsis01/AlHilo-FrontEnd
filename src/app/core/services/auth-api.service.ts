import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { User, AuthResponse, UserRole, AuthToken } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

// DTOs for authentication requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

interface ApiRoleResponse {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiStoreResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  rfc: string;
  url: string;
  logo: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiUserResponse {
  id: string;
  name: string;
  email: string;
  role: ApiRoleResponse;
  store: ApiStoreResponse;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface ApiAuthResponse {
  user: ApiUserResponse;
  token: ApiTokenResponse;
}

@Injectable({
  providedIn: 'root'
})

export class AuthApiService {
  private readonly endpoint = '/auth';

  constructor(private apiService: ApiService) {}

  login(email: string, password: string): Observable<AuthResponse> {
    const loginData: LoginRequest = { email, password };

    return this.apiService
      .post<ApiAuthResponse>(`${this.endpoint}/login`, loginData)
      .pipe(map(response => this.mapAuthResponse(response)));
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService
      .post<ApiAuthResponse>(`${this.endpoint}/register`, userData)
      .pipe(map(response => this.mapAuthResponse(response)));
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    const data: RefreshTokenRequest = { refresh_token: refreshToken };
    return this.apiService
      .post<ApiTokenResponse>(`${this.endpoint}/refresh`, data)
      .pipe(
        map(token => ({
          user: this.getStoredUser(),
          token: this.mapToken(token) })));
  }

  logout(): Observable<void> {
    return this.apiService.post<void>(`${this.endpoint}/logout`, {});
  }

  getCurrentUser(): Observable<User> {
    return this.apiService
      .get<ApiUserResponse>(`${this.endpoint}/me`)
      .pipe(map(user => this.mapUser(user)));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    const data: ChangePasswordRequest = {
      old_password: oldPassword,
      new_password: newPassword};
    
    return this.apiService.post<{ message: string }>(`${this.endpoint}/change-password`, data);
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>(`${this.endpoint}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>(`${this.endpoint}/reset-password`, {
      token,
      new_password: newPassword});
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>(`${this.endpoint}/verify-email`, { token });
  }

  private mapAuthResponse(response: ApiAuthResponse): AuthResponse {
    return {
      user: this.mapUser(response.user),
      token: this.mapToken(response.token)};
  }

  private mapUser(user: ApiUserResponse): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: this.mapRole(user.role),
      store: user.store ? this.mapStore(user.store) : null,
      isActive: user.is_active,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)};
  }

  private mapRole(role: ApiRoleResponse): UserRole {
    return {
      id: role.id,
      name: role.name,
      code: role.code};
  }

  private mapStore(store: ApiStoreResponse) {
    return {
      id: store.id,
      name: store.name,
      address: store.address,
      phone: store.phone,
      email: store.email,
      rfc: store.rfc,
      url: store.url,
      logo: store.logo,
      isActive: store.is_active,
      createdAt: new Date(store.created_at),
      updatedAt: new Date(store.updated_at)};
  }

  private mapToken(token: ApiTokenResponse): AuthToken {
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in};
  }

  private getStoredUser(): User {
    const userJson = localStorage.getItem(environment.userKey);

    if (!userJson) {
      throw new Error('No user found in local storage');
    }

    return JSON.parse(userJson) as User;
  }
}
