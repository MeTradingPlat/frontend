import { environment } from '../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from './language.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EstadoEscanerDTORespuesta } from '../models/estado-escaner.model';

@Injectable({
  providedIn: 'root'
})
export class EstadoEscanerService {
  private apiUrl = `${environment.apiUrl}/escaner/estado`; // Assuming backend runs on 8080

  private http = inject(HttpClient);
  private languageService = inject(LanguageService);

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': this.languageService.getCurrentLanguage(),
      'Content-Type': 'application/json'
    });
  }

  iniciarEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/${id}/iniciar`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  detenerEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/${id}/detener`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  archivarEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/${id}/archivar`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  desarchivarEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/${id}/desarchivar`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error && typeof error.error === 'string') {
      // Client-side or simple backend error
      errorMessage = `Error: ${error.error}`;
    } else if (error.error && typeof error.error === 'object' && error.error.message) {
      // Structured backend error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side or other errors
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      console.error(`Backend returned code ${error.status}, body was: ${JSON.stringify(error.error)}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error(errorMessage));
  }
}