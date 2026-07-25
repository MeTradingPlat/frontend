import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Market, Symbol, SymbolDetails, Timeframe } from '../models/screener.models';

/**
 * ScreenerService
 *
 * Servicio que comunica con MarketData Service (Java) como API Gateway/BFF.
 * El Frontend NUNCA habla directamente con Tastytrade.
 *
 * Endpoints (MetadataController, expuestos por el gateway bajo /marketdata/**):
 * - GET /marketdata/markets
 * - GET /marketdata/symbols
 * - GET /marketdata/symbols/{symbol}/details
 * - GET /marketdata/timeframes
 */
@Injectable({
  providedIn: 'root'
})
export class ScreenerService {
  private marketDataUrl = environment.marketDataUrl;
  private analysisUrl = environment.technicalAnalysisUrl;
  private http = inject(HttpClient);

  getMarkets(): Observable<Market[]> {
    return this.http.get<Market[]>(`${this.marketDataUrl}/markets`);
  }

  getSymbols(): Observable<Symbol[]> {
    return this.http.get<Symbol[]>(`${this.marketDataUrl}/symbols`);
  }

  getSymbolDetails(symbol: string): Observable<SymbolDetails> {
    return this.http.get<SymbolDetails>(`${this.marketDataUrl}/symbols/${symbol}/details`);
  }

  getTimeframes(): Observable<Timeframe[]> {
    return this.http.get<Timeframe[]>(`${this.marketDataUrl}/timeframes`);
  }

  /**
   * GET /api/v1/analysis/{symbol}
   * Obtiene indicadores técnicos desde Python (Signal Processing Service)
   */
  getTechnicalIndicators(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.analysisUrl}/${symbol}`)
      .pipe(map(response => response.indicators));
  }
}
