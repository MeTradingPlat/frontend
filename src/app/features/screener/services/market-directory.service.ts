import { Injectable, inject, signal } from '@angular/core';
import { ScreenerService } from './screener.service';

/**
 * Caches MetadataController's MIC-code -> friendly-name mapping
 * (GET /marketdata/markets) so any component can show "NYSE" instead
 * of "xnys" without each one fetching/duplicating the mapping.
 */
@Injectable({
  providedIn: 'root'
})
export class MarketDirectoryService {
  private readonly screenerService = inject(ScreenerService);
  private readonly names = signal<Record<string, string>>({});

  constructor() {
    this.screenerService.getMarkets().subscribe(markets => {
      this.names.set(Object.fromEntries(markets.map(m => [m.id.toLowerCase(), m.nombre])));
    });
  }

  label(code: string | undefined | null): string {
    if (!code) return '';
    return this.names()[code.toLowerCase()] ?? code;
  }
}
