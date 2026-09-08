import { Pipe, PipeTransform } from '@angular/core';

/**
 * Solo la fecha (sin hora) de un timestamp UTC en zona horaria de mercado
 * (Nueva York) -- companero de MarketDatetimePipe para vistas que necesitan
 * partir fecha y hora en renglones separados (ver scanner-signals-tab, para
 * que la columna no obligue a scroll horizontal).
 *
 * Uso: {{ row.timestamp | marketDate }} → DD/MM/YYYY
 */
@Pipe({
  name: 'marketDate',
  standalone: true,
})
export class MarketDatePipe implements PipeTransform {
  private static readonly NY_TIMEZONE = 'America/New_York';

  transform(value: string | null | undefined): string {
    if (!value) return '-';

    const utcString = /[Z+]/.test(value) ? value : value + 'Z';
    const date = new Date(utcString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString(undefined, {
      timeZone: MarketDatePipe.NY_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
