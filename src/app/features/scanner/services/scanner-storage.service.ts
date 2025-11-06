import { Injectable, inject } from '@angular/core';
import { Escaner } from '../models/escaner.interface';
import { Mercado } from '../models/mercado.interface';
import { StorageService } from '../../../core/services/storage.service';

/**
 * Servicio de almacenamiento local
 * Para uso offline o caché (opcional por ahora)
 */
@Injectable({
  providedIn: 'root'
})
export class ScannerStorageService {
  private readonly STORAGE_KEY = 'scanner_escaners';
  private readonly FAVORITES_KEY = 'scanner_favorites';
  private readonly MERCADOS_KEY = 'scanner_mercados';
  private readonly storageService = inject(StorageService);

  /**
   * Guarda escaneres en localStorage
   */
  saveEscaners(escaners: Escaner[]): void {
    this.storageService.setItem(this.STORAGE_KEY, escaners);
  }

  /**
   * Obtiene escaneres desde localStorage
   */
  getEscaners(): Escaner[] | null {
    return this.storageService.getItem<Escaner[]>(this.STORAGE_KEY);
  }

  /**
   * Limpia el storage de escaneres
   */
  clearEscanersCache(): void {
    this.storageService.removeItem(this.STORAGE_KEY);
  }

  /**
   * Guarda un escáner favorito
   */
  saveFavorite(id: number): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(id)) {
      favorites.push(id);
      this.storageService.setItem(this.FAVORITES_KEY, favorites);
    }
  }

  /**
   * Elimina un escáner favorito
   */
  removeFavorite(id: number): void {
    let favorites = this.getFavorites();
    favorites = favorites.filter(favId => favId !== id);
    this.storageService.setItem(this.FAVORITES_KEY, favorites);
  }

  /**
   * Obtiene la lista de IDs de escáneres favoritos
   */
  getFavorites(): number[] {
    return this.storageService.getItem<number[]>(this.FAVORITES_KEY) || [];
  }

  /**
   * Guarda mercados en localStorage
   */
  saveMercados(mercados: Mercado[]): void {
    this.storageService.setItem(this.MERCADOS_KEY, mercados);
  }

  /**
   * Obtiene mercados desde localStorage
   */
  getMercados(): Mercado[] | null {
    return this.storageService.getItem<Mercado[]>(this.MERCADOS_KEY);
  }

  /**
   * Limpia el storage de mercados
   */
  clearMercadosCache(): void {
    this.storageService.removeItem(this.MERCADOS_KEY);
  }

  /**
   * Limpia todo el storage relacionado con el scanner
   */
  clearAllScannerStorage(): void {
    this.storageService.removeItem(this.STORAGE_KEY);
    this.storageService.removeItem(this.FAVORITES_KEY);
    this.storageService.removeItem(this.MERCADOS_KEY);
  }
}