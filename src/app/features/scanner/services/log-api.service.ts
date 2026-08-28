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

  getFechasSenial(idEscaner: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/escaner/${idEscaner}/fechas`);
  }

  getLogsPorEscanerYFecha(idEscaner: number, fecha: string, page: number = 0, size: number = 50): Observable<RegistroLogDTORespuesta[]> {
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}?fecha=${fecha}&page=${page}&size=${size}`);
  }

  getFechasRegistro(idEscaner: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/escaner/${idEscaner}/fechas-registro`);
  }

  getRegistroPorEscanerTodas(idEscaner: number, page: number = 0, size: number = 50, fecha?: string): Observable<RegistroLogDTORespuesta[]> {
    const fechaParam = fecha ? `&fecha=${fecha}` : '';
    return this.http.get<RegistroLogDTORespuesta[]>(`${this.apiUrl}/escaner/${idEscaner}/todas?page=${page}&size=${size}${fechaParam}`);
  }

  // Total de una fecha ya cerrada, para el paginador (numeros de pagina y
  // salto directo) -- "hoy" no lo necesita, sigue con SSE en vivo + cargar mas.
  contarSenialesPorEscanerYFecha(idEscaner: number, fecha: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/escaner/${idEscaner}/count?fecha=${fecha}`);
  }

  contarRegistrosPorEscanerYFecha(idEscaner: number, fecha: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/escaner/${idEscaner}/todas/count?fecha=${fecha}`);
  }
}
