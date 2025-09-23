import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { LanguageService } from './language.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoriaDTORespuesta } from '../models/categoria.model';
import { FiltroDtoRespuesta } from '../models/filtro.model';
import { FiltroDtoPeticion } from '../models/filtro-peticion.model';
import { EnumCategoriaFiltro } from '../enums/enum-categoria-filtro';
import { EnumFiltro } from '../enums/enum-filtro';

@Injectable({
  providedIn: 'root'
})
export class FiltroService {
  private apiUrl = 'http://localhost:5000/api/escaner/filtro'; // Assuming backend runs on 8080

  private http = inject(HttpClient);
  private languageService = inject(LanguageService);

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': this.languageService.getCurrentLanguage(),
      'Content-Type': 'application/json'
    });
  }

  getCategorias(): Observable<CategoriaDTORespuesta[]> {
    return this.http.get<CategoriaDTORespuesta[]>(`${this.apiUrl}/categorias`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getFiltrosByCategory(categoria: EnumCategoriaFiltro): Observable<FiltroDtoRespuesta[]> {
    let params = new HttpParams().set('categoria', categoria);
    return this.http.get<FiltroDtoRespuesta[]>(this.apiUrl, { headers: this.getHeaders(), params }).pipe(
      catchError(this.handleError)
    );
  }

  getDefaultFiltro(enumFiltro: EnumFiltro): Observable<FiltroDtoRespuesta> {
    let params = new HttpParams().set('filtro', enumFiltro);
    return this.http.get<FiltroDtoRespuesta>(`${this.apiUrl}/defecto`, { headers: this.getHeaders(), params }).pipe(
      catchError(this.handleError)
    );
  }

  getScannerFiltros(idEscaner: number): Observable<FiltroDtoRespuesta[]> {
    return this.http.get<FiltroDtoRespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  saveFiltros(idEscaner: number, filtros: FiltroDtoPeticion[]): Observable<FiltroDtoRespuesta[]> {
    return this.http.post<FiltroDtoRespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}`, filtros, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteFiltro(idFiltro: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${idFiltro}`, { headers: this.getHeaders() }).pipe(
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