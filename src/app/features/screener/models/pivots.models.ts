export interface PivotLevel {
  timestamp: string;
  price: number;
}

export interface PivotsResponse {
  symbol: string;
  currentPrice: number;
  timeframe: string;
  resistances: PivotLevel[];
  supports: PivotLevel[];
}
