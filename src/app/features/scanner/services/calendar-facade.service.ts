import { Injectable, inject, signal } from '@angular/core';
import { ScannerApiService } from './scanner-api.service';
import { CalendarioEstadoDTORespuesta } from '../models/calendario-estado.interface';

/** Estado del calendario de dias habiles -- se pide una sola vez (no cambia
 * durante la sesion del usuario) y se comparte entre todas las tarjetas y
 * el dialogo expandido de escaner. */
@Injectable({ providedIn: 'root' })
export class CalendarFacadeService {
  private readonly apiService = inject(ScannerApiService);
  readonly estado = signal<CalendarioEstadoDTORespuesta | null>(null);
  private requested = false;

  ensureLoaded(): void {
    if (this.requested) return;
    this.requested = true;
    this.apiService.getEstadoCalendario().subscribe({
      next: (dto) => this.estado.set(dto),
      error: () => { this.requested = false; },
    });
  }
}
