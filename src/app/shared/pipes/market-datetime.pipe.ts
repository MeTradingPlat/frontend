import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte un string ISO datetime (UTC sin zona horaria) a hora de
 * mercado (Nueva York, con horario de verano automatico) -- toda la
 * plataforma opera sobre mercados de EE.UU., asi que las horas mostradas
 * al usuario (señales, registro de actividad, gráficas) usan siempre esa
 * referencia en vez de la hora del navegador, para que coincidan con el
 * horario del escaner (que tambien es hora de Nueva York).
 *
 * El backend envía timestamps en formato "2026-03-17T13:30:00" (UTC sin 'Z').
 * Este pipe añade 'Z' para que el navegador lo interprete correctamente como UTC.
 *
 * Uso:
 *   {{ row.timestamp | marketDatetime }}          → sin segundos (DD/MM/YYYY HH:MM ET)
 *   {{ row.timestamp | marketDatetime : true }}   → con segundos (DD/MM/YYYY HH:MM:SS ET)
 */
@Pipe({
  name: 'marketDatetime',
  standalone: true,
})
export class MarketDatetimePipe implements PipeTransform {
  private static readonly NY_TIMEZONE = 'America/New_York';

  transform(value: string | null | undefined, showSeconds = false): string {
    if (!value) return '-';

    // Si no tiene indicador de zona horaria, añadir 'Z' para indicar UTC
    const utcString = /[Z+]/.test(value) ? value : value + 'Z';
    const date = new Date(utcString);

    if (isNaN(date.getTime())) return '-';

    const formatted = date.toLocaleString(undefined, {
      timeZone: MarketDatetimePipe.NY_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds ? { second: '2-digit' } : {}),
    });

    return `${formatted} ET`;
  }
}
