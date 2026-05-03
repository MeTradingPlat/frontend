import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Market, SymbolSummary, SymbolDetails } from '../models/screener.models';

@Injectable({
  providedIn: 'root'
})
export class ScreenerService {
  private apiUrl = environment.apiUrl + '/marketdata';
  private http = inject(HttpClient);

  getMarkets(): Observable<Market[]> {
    return this.http.get<Market[]>(`${this.apiUrl}/markets`);
  }

  getSymbols(markets?: string[]): Observable<SymbolSummary[]> {
    let params = new HttpParams();
    if (markets && markets.length > 0) {
      params = params.set('markets', markets.join(','));
    }
    return this.http.get<SymbolSummary[]>(`${this.apiUrl}/symbols`, { params });
  }

  getSymbolDetails(symbol: string): Observable<SymbolDetails> {
    return this.http.get<SymbolDetails>(`${this.apiUrl}/symbols/${symbol}/details`);
  }
}
