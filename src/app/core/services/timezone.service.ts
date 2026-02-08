import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {

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
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || '';
  }
}
