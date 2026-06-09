import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError, timeout } from 'rxjs';

export interface EnrollRequest {
  userId: string;
  fingerprintSamples: string[];
}

export interface EnrollResponse {
  success: boolean;
  templatesGenerated: number;
  message?: string;
}

export interface IdentifyRequest {
  fingerprintData: string;
}

export interface IdentifyResponse {
  matchFound: boolean;
  userId?: string;
}

export const environment = {
  production: false,
  biometricApiUrl: 'http://localhost:5004/api/biometrics',
  serviceTimeout: 15000
};

@Injectable({
  providedIn: 'root'
})

export class BiometricService {
  private readonly apiUrl = environment.biometricApiUrl;

  constructor(
    private http: HttpClient
  ) {}

  enroll(userId: string, fingerprintSamples: string[]): Observable<EnrollResponse> {
    return this.http.post<EnrollResponse>(`${this.apiUrl}/enroll`, 
        { UserId: userId, Samples: fingerprintSamples })
        .pipe(timeout(environment.serviceTimeout),
        catchError(error => {
            if (error.name === 'TimeoutError') {
                return throwError(() =>
                    new Error('No fue posible conectar con el servicio biométrico local. Verifique que el servicio AlHilo Biometric Service esté en ejecución.'));
            }
            return throwError(() => error);
        }));
  }

  identify(fingerprintData: string): Observable<IdentifyResponse> {
    return this.http.post<IdentifyResponse>(`${this.apiUrl}/identify`, { Sample: fingerprintData })
      .pipe(timeout(environment.serviceTimeout),
        catchError(error => {
          if (error.name === 'TimeoutError') {
            return throwError(() =>
              new Error('No fue posible conectar con el servicio biométrico local. Verifique que el servicio AlHilo Biometric Service esté en ejecución.'));
          }
          return throwError(() => error);
        }));
  }
}