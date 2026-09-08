import { Pipe, PipeTransform } from '@angular/core';

/**
 * Solo la hora (sin fecha) de un timestamp UTC en zona horaria de mercado
 * (Nueva York), con "ET" al final -- companero de MarketDatetimePipe (ver
 * su comentario) para partir fecha y hora en renglones separados.
 *
 * Uso:
 *   {{ row.timestamp | marketTime }}          → HH:MM ET
 *   {{ row.timestamp | marketTime : true }}   → HH:MM:SS ET
 */
@Pipe({
  name: 'marketTime',
  standalone: true,
})
export class MarketTimePipe implements PipeTransform {
  private static readonly NY_TIMEZONE = 'America/New_York';

  transform(value: string | null | undefined, showSeconds = false): string {
    if (!value) return '-';

    const utcString = /[Z+]/.test(value) ? value : value + 'Z';
    const date = new Date(utcString);
    if (isNaN(date.getTime())) return '-';

    const formatted = date.toLocaleTimeString(undefined, {
      timeZone: MarketTimePipe.NY_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds ? { second: '2-digit' } : {}),
    });

    return `${formatted} ET`;
  }
}
