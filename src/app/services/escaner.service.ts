import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from './language.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EscanerDTOPeticion, EscanerDTORespuesta } from '../models/escaner.model';

@Injectable({
  providedIn: 'root'
})
export class EscanerService {
  private apiUrl = 'http://localhost:5000/api/escaner'; 

  private http = inject(HttpClient);
  private languageService = inject(LanguageService);

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': this.languageService.getCurrentLanguage(),
      'Content-Type': 'application/json'
    });
  }

  createEscaner(escaner: EscanerDTOPeticion): Observable<EscanerDTORespuesta> {
    return this.http.post<EscanerDTORespuesta>(this.apiUrl, escaner, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getEscanerById(id: number): Observable<EscanerDTORespuesta> {
    return this.http.get<EscanerDTORespuesta>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getEscaneres(): Observable<EscanerDTORespuesta[]> {
    return this.http.get<EscanerDTORespuesta[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getArchivedEscaneres(): Observable<EscanerDTORespuesta[]> {
    return this.http.get<EscanerDTORespuesta[]>(`${this.apiUrl}/archivados`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  updateEscaner(id: number, escaner: EscanerDTOPeticion): Observable<EscanerDTORespuesta> {
    return this.http.put<EscanerDTORespuesta>(`${this.apiUrl}/${id}`, escaner, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteEscaner(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
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