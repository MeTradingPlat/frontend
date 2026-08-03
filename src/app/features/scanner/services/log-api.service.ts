import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegistroLogDTORespuesta } from '../models/registro-log.interface';

@Injectable({
  providedIn: 'root'
})
export class LogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/logs`;

  getLogs(): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(this.apiUrl);
  }

  getLogById(id: number): Observable<RegistroLogDTORespuesta> {
    return this.http.get<RegistroLogDTORespuesta>(`${this.apiUrl}/${id}`);
  }

  getLogsPorServicio(servicioOrigen: string): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/servicio/${servicioOrigen}`);
  }

  getLogsPorEscaner(idEscaner: number): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}`);
  }

  getLogsPorEscanerPaginated(idEscaner: number, page: number = 0, size: number = 50): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}?page=${page}&size=${size}`);
  }

  getFechasSenial(idEscaner: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/escaner/${idEscaner}/fechas`);
  }

  getLogsPorEscanerYFecha(idEscaner: number, fecha: string, page: number = 0, size: number = 50): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}?fecha=${fecha}&page=${page}&size=${size}`);
  }
}
