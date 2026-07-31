/**
 * Wire format from CandleWebSocketHandler (marketdata-service, /ws/candles).
 * `closed` mirrors Binance kline's "x" field: false while the bar is still
 * forming, true once its timeframe window has elapsed.
 */
export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closed: boolean;
}

export interface CandleHistoryMessage {
  type: 'history';
  symbol: string;
  timeframe: string;
  bars: CandleBar[];
}

export interface CandleBarMessage {
  type: 'bar';
  symbol: string;
  timeframe: string;
  bar: CandleBar;
}

export interface CandleControlMessage {
  type: 'subscription_confirmed' | 'subscription_cancelled' | 'error';
  symbol?: string;
  timeframe?: string;
  action?: string;
  message?: string;
}

export type CandleStreamMessage = CandleHistoryMessage | CandleBarMessage | CandleControlMessage;

/**
 * Wire format from HistoricalDataRestController (GET /marketdata/historical/{symbol}),
 * used to backfill older bars when the user pans left past what the WS gave us.
 */
export interface HistoricalCandleDTO {
  symbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

/**
 * Un filtro tecnico que hizo match en una senal del escaner, con la
 * temporalidad en la que se evaluo y la vela exacta que lo disparo (viene en
 * `metadatos` de RegistroLog, ver signal-processing-service/kafka_producer.py).
 */
export interface SignalFilterMatch {
  filtro: string;
  timeframe: string;
  velaTimestamp: string;
}
