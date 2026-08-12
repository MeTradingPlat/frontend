import { Injectable, signal } from '@angular/core';

const TICK_MS = 30_000;

/** Señal que se actualiza cada 30s -- para recalcular displays que dependen
 * solo del paso del reloj (ej. "activo hasta las 20:00"), sin depender de
 * ningun evento SSE ni cambio de datos del backend. */
@Injectable({ providedIn: 'root' })
export class ClockTickService {
  readonly now = signal(Date.now());

  constructor() {
    setInterval(() => this.now.set(Date.now()), TICK_MS);
  }
}
