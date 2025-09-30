import { environment } from '../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from './language.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MercadoDTORespuesta } from '../models/mercado.model';

@Injectable({
  providedIn: 'root'
})
export class MercadoService {
  private apiUrl = `${environment.apiUrl}/escaner/mercado`;

  private http = inject(HttpClient);
  private languageService = inject(LanguageService);

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': this.languageService.getCurrentLanguage(),
      'Content-Type': 'application/json'
    });
  }

  getMercados(): Observable<MercadoDTORespuesta[]> {
    return this.http.get<MercadoDTORespuesta[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
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