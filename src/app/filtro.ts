import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FiltroDtoRespuesta } from './models/filtro.model';
import { EnumFiltro } from './enums/enum-filtro';

@Injectable({
  providedIn: 'root'
})
export class FiltroService {

  private apiUrl = '/api/escaner/filtro';

  constructor(private http: HttpClient) { }

  obtenerFiltroPorDefecto(enumFiltro: EnumFiltro): Observable<FiltroDtoRespuesta> {
    const url = `${this.apiUrl}/defecto`;
    const params = { filtro: EnumFiltro[enumFiltro] }; // Corregido: enviar el nombre del enum como string
    
    console.log(`FiltroService: Realizando petición GET a ${url} con parámetros:`, params); // DEBUG

    return this.http.get<FiltroDtoRespuesta>(url, { params }).pipe(
      tap(response => console.log('FiltroService: Respuesta exitosa:', response)), // DEBUG
      catchError(this.handleError) // Manejo de errores
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido en la petición.';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red.
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // El backend devolvió un código de respuesta con error.
      errorMessage = `Error del servidor: ${error.status} - ${error.message || ''}`;
      console.error('Detalles del error del servidor:', error.error); // DEBUG
    }
    console.error('FiltroService: Error en la petición:', errorMessage); // DEBUG
    return throwError(() => new Error(errorMessage));
  }
}
