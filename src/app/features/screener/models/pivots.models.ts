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

// Mismos 5 parametros que acepta GET /escaner/pivots/{symbol} en
// scanner-management-service (y, debajo, signal-processing-service) --
// ninguno tiene que mandarse, el backend ya trae sus propios defaults.
export interface PivotsConfig {
  atrLength: number;
  slipRatioPct: number;
  longitudVelas: number;
  aniosHistorico: number;
  numeroPivotes: number;
}
