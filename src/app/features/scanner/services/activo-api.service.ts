import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActivoDTORespuesta } from '../models/activo.interface';

/**
 * Servicio de API para Activos - Comunicación con asset-management-service
 */
@Injectable({
  providedIn: 'root'
})
export class ActivoApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/activos`;

  /**
   * Obtiene todos los activos
   */
  getActivos(): Observable<ActivoDTORespuesta[]> {
    return this.http.get<ActivoDTORespuesta[]>(this.apiUrl);
  }

  /**
   * Obtiene un activo por ID
   */
  getActivoById(id: number): Observable<ActivoDTORespuesta> {
    return this.http.get<ActivoDTORespuesta>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene activos por ID de escaner
   */
  getActivosPorEscaner(idEscaner: number): Observable<ActivoDTORespuesta[]> {
    return this.http.get<ActivoDTORespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}`);
  }
}
