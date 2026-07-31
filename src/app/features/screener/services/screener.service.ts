import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Market, PaginatedResponse, Symbol, SymbolDetails, Timeframe } from '../models/screener.models';
import { HistoricalCandleDTO } from '../models/candle.models';

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

  /**
   * GET /marketdata/symbols/search — busqueda+paginacion en servidor, para no
   * traer los ~13k simbolos completos al cliente en cada carga/filtro.
   */
  searchSymbols(query: string, markets: string[], page: number, size: number): Observable<PaginatedResponse<Symbol>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query) params = params.set('q', query);
    if (markets.length) params = params.set('markets', markets.join(','));
    return this.http.get<PaginatedResponse<Symbol>>(`${this.marketDataUrl}/symbols/search`, { params });
  }

  getSymbolDetails(symbol: string): Observable<SymbolDetails> {
    return this.http.get<SymbolDetails>(`${this.marketDataUrl}/symbols/${symbol}/details`);
  }

  getTimeframes(): Observable<Timeframe[]> {
    return this.http.get<Timeframe[]>(`${this.marketDataUrl}/timeframes`);
  }

  /**
   * GET /marketdata/historical/{symbol} — barras completas terminando ANTES
   * de `endDate` (exclusivo). Usado para rellenar historial mas viejo del
   * que el WS de velas entrega (ese solo da un snapshot fijo de 500 barras).
   */
  getHistoricalCandles(symbol: string, timeframe: string, endDate: string, bars: number): Observable<HistoricalCandleDTO[]> {
    const params = new HttpParams().set('timeframe', timeframe).set('endDate', endDate).set('bars', bars);
    return this.http.get<HistoricalCandleDTO[]>(`${this.marketDataUrl}/historical/${symbol}`, { params });
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
