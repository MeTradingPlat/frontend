import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte un string ISO datetime (UTC sin zona horaria) a la hora local del navegador.
 *
 * El backend envía timestamps en formato "2026-03-17T13:30:00" (UTC sin 'Z').
 * Este pipe añade 'Z' para que el navegador lo interprete correctamente como UTC
 * y luego lo convierte a la hora local del usuario automáticamente.
 *
 * Uso:
 *   {{ row.timestamp | localDatetime }}          → sin segundos (DD/MM/YYYY HH:MM)
 *   {{ row.timestamp | localDatetime : true }}   → con segundos (DD/MM/YYYY HH:MM:SS)
 */
@Pipe({
  name: 'localDatetime',
  standalone: true,
})
export class LocalDatetimePipe implements PipeTransform {
  transform(value: string | null | undefined, showSeconds = false): string {
    if (!value) return '-';

    // Si no tiene indicador de zona horaria, añadir 'Z' para indicar UTC
    const utcString = /[Z+]/.test(value) ? value : value + 'Z';
    const date = new Date(utcString);

    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds ? { second: '2-digit' } : {}),
    });
  }
}
