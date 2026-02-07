import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Eliminar HttpErrorResponse
import { Observable } from 'rxjs'; // Eliminar throwError
import { environment } from '../../../../environments/environment';
import { EscanerDTOPeticion, EscanerDTORespuesta } from '../models/escaner.interface';
import { EstadoEscanerDTORespuesta } from '../models/estado-escaner.interface';
import { MercadoDTORespuesta } from '../models/mercado.interface';
import { FiltroDtoRespuesta, FiltroDtoPeticion } from '../models/filtro.interface';
import { CategoriaDTORespuesta } from '../models/categoria.interface';
// Eliminar ApiError, ya que el interceptor lo maneja

/**
 * Servicio de API - Solo comunicación HTTP pura
 * NO maneja estado, NO tiene lógica de negocio
 */
@Injectable({
  providedIn: 'root'
})
export class ScannerApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/escaner`;
  private readonly filtroApiUrl = `${environment.apiUrl}/escaner/filtro`;

  /**
   * Obtiene todos los escaneres activos
   */
  getEscaneres(): Observable<EscanerDTORespuesta[]> {
    return this.http.get<EscanerDTORespuesta[]>(this.apiUrl); // Eliminar catchError
  }

  /**
   * Obtiene escaneres archivados
   */
  getArchivedEscaneres(): Observable<EscanerDTORespuesta[]> {
    return this.http.get<EscanerDTORespuesta[]>(`${this.apiUrl}/archivados`); // Eliminar catchError
  }

  /**
   * Obtiene un escaner por ID
   */
  getEscanerById(id: number): Observable<EscanerDTORespuesta> {
    return this.http.get<EscanerDTORespuesta>(`${this.apiUrl}/${id}`); // Eliminar catchError
  }

  /**
   * Crea un nuevo escaner
   */
  createEscaner(escaner: EscanerDTOPeticion): Observable<EscanerDTORespuesta> {
    return this.http.post<EscanerDTORespuesta>(this.apiUrl, escaner); // Eliminar catchError
  }

  /**
   * Actualiza un escaner existente
   */
  updateEscaner(id: number, escaner: EscanerDTOPeticion): Observable<EscanerDTORespuesta> {
    return this.http.put<EscanerDTORespuesta>(`${this.apiUrl}/${id}`, escaner); // Eliminar catchError
  }

  /**
   * Elimina un escaner
   */
  deleteEscaner(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Archiva un escaner (si tu backend lo soporta)
   */
  archiveEscaner(id: number): Observable<EscanerDTORespuesta> {
    return this.http.patch<EscanerDTORespuesta>(`${this.apiUrl}/${id}/archivar`, {});
  }

  /**
   * Lista todos los mercados disponibles
   */
  listMercados(): Observable<MercadoDTORespuesta[]> {
    return this.http.get<MercadoDTORespuesta[]>(`${this.apiUrl}/mercado`);
  }

  /**
   * Inicia un escaner
   */
  iniciarEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/estado/${id}/iniciar`, {});
  }

  /**
   * Detiene un escaner
   */
  detenerEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/estado/${id}/detener`, {});
  }

  /**
   * Archiva un escaner
   */
  archivarEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/estado/${id}/archivar`, {});
  }

  /**
   * Desarchiva un escaner
   */
  desarchivarEscaner(id: number): Observable<EstadoEscanerDTORespuesta> {
    return this.http.post<EstadoEscanerDTORespuesta>(`${this.apiUrl}/estado/${id}/desarchivar`, {});
  }

  // ===== MÉTODOS DE FILTROS =====

  /**
   * Obtiene todas las categorías de filtros disponibles
   */
  getCategoriasFiltros(): Observable<CategoriaDTORespuesta[]> {
    return this.http.get<CategoriaDTORespuesta[]>(`${this.filtroApiUrl}/categorias`);
  }

  /**
   * Obtiene los filtros por categoría
   */
  getFiltrosPorCategoria(categoria: string): Observable<FiltroDtoRespuesta[]> {
    return this.http.get<FiltroDtoRespuesta[]>(this.filtroApiUrl, {
      params: { categoria }
    });
  }

  /**
   * Obtiene el filtro por defecto
   */
  getFiltroPorDefecto(enumFiltro: string): Observable<FiltroDtoRespuesta> {
    return this.http.get<FiltroDtoRespuesta>(`${this.filtroApiUrl}/defecto`, {
      params: { filtro: enumFiltro }
    });
  }

  /**
   * Obtiene los filtros de un escaner específico
   */
  getFiltrosEscaner(idEscaner: number): Observable<FiltroDtoRespuesta[]> {
    return this.http.get<FiltroDtoRespuesta[]>(`${this.filtroApiUrl}/escaner/${idEscaner}`);
  }

  /**
   * Guarda los filtros de un escaner
   */
  guardarFiltrosEscaner(idEscaner: number, filtros: FiltroDtoPeticion[]): Observable<FiltroDtoRespuesta[]> {
    return this.http.post<FiltroDtoRespuesta[]>(`${this.filtroApiUrl}/escaner/${idEscaner}`, filtros);
  }
  

  // Eliminar el método handleError, ya que ahora se maneja en el interceptor
}
