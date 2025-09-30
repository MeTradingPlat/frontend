import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private healthUrl = `${environment.apiUrl}/health`; // Assuming a /health endpoint on the backend

  private http = inject(HttpClient);

  getHealthStatus(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(this.healthUrl).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred during health check!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}