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

// "live" = ultimo trade real (default, de siempre). "open" = apertura de la
// vela D1 de HOY (falla si el mercado no abrio todavia). "prev_close" =
// cierre de la ultima vela D1 YA CERRADA (el dia anterior si hoy sigue
// abierto). Ver _resolve_current_price en signal-processing-service.
export type PivotsPriceReference = 'live' | 'open' | 'prev_close';

// Mismos parametros que acepta GET /escaner/pivots/{symbol} en
// scanner-management-service (y, debajo, signal-processing-service) --
// ninguno tiene que mandarse, el backend ya trae sus propios defaults.
export interface PivotsConfig {
  atrLength: number;
  slipRatioPct: number;
  longitudVelas: number;
  aniosHistorico: number;
  numeroPivotes: number;
  priceReference: PivotsPriceReference;
}
