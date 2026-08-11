import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private readonly NY_TIMEZONE = 'America/New_York';

  /**
   * Obtiene el timezone del navegador (ej: "America/Mexico_City")
   */
  getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Obtiene el offset en minutos del timezone local respecto a UTC
   * Ejemplo: México (UTC-6) retorna 360
   */
  getUserTimezoneOffsetMinutes(): number {
    return new Date().getTimezoneOffset();
  }

  /**
   * Convierte hora local a UTC
   * @param localTime - Hora en formato HH:MM:SS en timezone local
   * @returns Hora en formato HH:MM:SS en UTC
   */
  convertLocalToUTC(localTime: string): string {
    const [hours, minutes, seconds] = localTime.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, seconds || 0, 0);

    const utcHours = now.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0');
    const utcSeconds = now.getUTCSeconds().toString().padStart(2, '0');

    return `${utcHours}:${utcMinutes}:${utcSeconds}`;
  }

  /**
   * Convierte hora UTC a local
   * @param utcTime - Hora en formato HH:MM:SS en UTC
   * @returns Hora en formato HH:MM:SS en timezone local
   */
  convertUTCToLocal(utcTime: string): string {
    const [hours, minutes, seconds] = utcTime.split(':').map(Number);
    const now = new Date();
    now.setUTCHours(hours, minutes, seconds || 0, 0);

    const localHours = now.getHours().toString().padStart(2, '0');
    const localMinutes = now.getMinutes().toString().padStart(2, '0');
    const localSeconds = now.getSeconds().toString().padStart(2, '0');

    return `${localHours}:${localMinutes}:${localSeconds}`;
  }

  /**
   * Obtiene el nombre corto del timezone (ej: "CST", "EST")
   */
  getTimezoneAbbreviation(): string {
    return this.shortAbbreviation(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

  private shortAbbreviation(timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value ?? '';
  }

  // Offset actual (en minutos, mismo signo que Date.getTimezoneOffset: lo
  // que hay que SUMAR a la hora local para llegar a UTC) de Nueva York --
  // se recalcula contra la fecha de hoy en vez de usar un numero fijo
  // (GMT-4/GMT-5) porque Nueva York cambia de EDT a EST dos veces al año y
  // un offset fijo quedaria mal medio año.
  private getNewYorkOffsetMinutes(reference: Date = new Date()): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.NY_TIMEZONE, timeZoneName: 'shortOffset',
    }).formatToParts(reference);
    const raw = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
    const match = raw.match(/GMT([+-]\d+)/);
    return match ? -parseInt(match[1], 10) * 60 : 0;
  }

  /**
   * Convierte una hora del navegador (HH:MM:SS) a la hora equivalente en
   * el mercado de Nueva York, respetando horario de verano automaticamente.
   */
  convertLocalToNewYork(localTime: string): string {
    const [hours, minutes, seconds] = localTime.split(':').map(Number);
    const nyOffset = this.getNewYorkOffsetMinutes();
    const localOffset = new Date().getTimezoneOffset();
    return this.formatMinutes(hours * 60 + minutes - (nyOffset - localOffset), seconds);
  }

  /**
   * Inversa de convertLocalToNewYork -- usada por los atajos de sesion de
   * mercado (pre-market/regular/post-market) para traducir la hora fija de
   * Nueva York a la hora local de quien esta configurando el escaner.
   */
  convertNewYorkToLocal(nyTime: string): string {
    const [hours, minutes, seconds] = nyTime.split(':').map(Number);
    const nyOffset = this.getNewYorkOffsetMinutes();
    const localOffset = new Date().getTimezoneOffset();
    return this.formatMinutes(hours * 60 + minutes + (nyOffset - localOffset), seconds);
  }

  /** UTC (lo que guarda el backend) <-> hora de Nueva York directo, sin
   * pasar por la hora local del navegador -- compuesto sobre las
   * conversiones ya probadas de arriba en vez de duplicar la cuenta. */
  convertUTCToNewYork(utcTime: string): string {
    return this.convertLocalToNewYork(this.convertUTCToLocal(utcTime));
  }

  convertNewYorkToUTC(nyTime: string): string {
    return this.convertLocalToUTC(this.convertNewYorkToLocal(nyTime));
  }

  /**
   * Segundos a sumarle a un Unix timestamp UTC real para que lightweight-charts
   * lo muestre como hora de mercado (Nueva York). La libreria NO usa la zona
   * horaria del navegador para nada -- interpreta y formatea todo timestamp
   * como si fuera UTC directamente (confirmado en su documentacion oficial:
   * tradingview.github.io/lightweight-charts/docs/time-zones). Por eso el
   * shift debe depender SOLO de la diferencia UTC<->Nueva York, nunca de la
   * zona horaria de quien mira la pantalla.
   *
   * Bug real que esto reemplaza: la formula anterior restaba tambien el
   * offset del navegador (asumiendo que la libreria SI formatea en hora
   * local), asi que solo daba la hora correcta quien tuviera el navegador en
   * UTC -- para cualquier otro huso mostraba una hora sin sentido (ni la UTC
   * real ni la de Nueva York), confirmado en vivo con una senal de GRI donde
   * la barra real era a las 14:20 UTC pero el grafico mostraba otra hora.
   */
  getMarketDisplayShiftSeconds(): number {
    return -this.getNewYorkOffsetMinutes() * 60;
  }

  private formatMinutes(totalMinutes: number, seconds = 0): string {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hh = Math.floor(normalized / 60).toString().padStart(2, '0');
    const mm = (normalized % 60).toString().padStart(2, '0');
    const ss = (seconds || 0).toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
}
