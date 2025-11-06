import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Guarda un valor en localStorage.
   * @param key La clave bajo la cual se guardará el valor.
   * @param value El valor a guardar. Se convertirá a JSON string.
   */
  setItem<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      return; // No hacer nada en el servidor
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error guardando en localStorage para la clave ${key}:`, error);
    }
  }

  /**
   * Obtiene un valor de localStorage.
   * @param key La clave del valor a obtener.
   * @returns El valor parseado de JSON, o null si no se encuentra o hay un error.
   */
  getItem<T>(key: string): T | null {
    if (!this.isBrowser) {
      return null; // Retornar null en el servidor
    }
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) as T : null;
    } catch (error) {
      console.error(`Error leyendo de localStorage para la clave ${key}:`, error);
      return null;
    }
  }

  /**
   * Elimina un valor de localStorage.
   * @param key La clave del valor a eliminar.
   */
  removeItem(key: string): void {
    if (!this.isBrowser) {
      return; // No hacer nada en el servidor
    }
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error eliminando de localStorage para la clave ${key}:`, error);
    }
  }

  /**
   * Limpia todo el localStorage.
   */
  clear(): void {
    if (!this.isBrowser) {
      return; // No hacer nada en el servidor
    }
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error limpiando todo el localStorage:', error);
    }
  }
}
