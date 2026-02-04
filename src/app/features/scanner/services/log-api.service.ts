import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegistroLogDTORespuesta } from '../models/registro-log.interface';

/**
 * Servicio de API para Logs - Comunicación con log-service
 */
@Injectable({
  providedIn: 'root'
})
export class LogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logs`;

  /**
   * Obtiene todos los logs
   */
  getLogs(): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(this.apiUrl);
  }

  /**
   * Obtiene un log por ID
   */
  getLogById(id: number): Observable<RegistroLogDTORespuesta> {
    return this.http.get<RegistroLogDTORespuesta>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene logs por servicio de origen
   */
  getLogsPorServicio(servicioOrigen: string): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/servicio/${servicioOrigen}`);
  }

  /**
   * Obtiene logs por ID de escaner
   */
  getLogsPorEscaner(idEscaner: number): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}`);
  }
}
