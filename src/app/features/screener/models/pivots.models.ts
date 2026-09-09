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
// abierto). "signal" = el precio EXACTO al que disparo la senal del
// escaner que abrio este grafico -- solo tiene sentido (y solo se ofrece
// en el dialogo) cuando esa senal trae precio, ver signalPrice mas abajo.
// Ver _resolve_current_price en signal-processing-service.
export type PivotsPriceReference = 'live' | 'open' | 'prev_close' | 'signal';

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
  // Solo se manda (como explicitPrice) cuando priceReference='signal' --
  // hay senales sin precio (ver el comentario de PivotsPriceReference), asi
  // que este campo puede faltar aunque priceReference no sea 'signal' en
  // absoluto.
  signalPrice?: number;
}
