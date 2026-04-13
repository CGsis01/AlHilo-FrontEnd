import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiError } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params, headers: this.getHeaders() })
      .pipe(
        map(response => response.data),
        catchError(this.handleError));
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { headers: this.getHeaders() })
      .pipe(
        map(response => response.data),
        catchError(this.handleError));
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { headers: this.getHeaders() })
      .pipe(
        map(response => response.data),
        catchError(this.handleError));
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { headers: this.getHeaders() })
      .pipe(
        map(response => response.data),
        catchError(this.handleError));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() })
      .pipe(
        map(response => response.data),
        catchError(this.handleError));
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(environment.tokenKey);
    
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      const apiError = error.error as ApiError;
      
      errorMessage = apiError?.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }
}
