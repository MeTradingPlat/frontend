export interface PivotLevel {
  timestamp: string;
  price: number;
  strength: 'strong' | 'weak';
}

export interface PivotsResponse {
  symbol: string;
  currentPrice: number;
  timeframe: string;
  resistances: PivotLevel[];
  supports: PivotLevel[];
}
