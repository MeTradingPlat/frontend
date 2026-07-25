/**
 * Screener MarketData Integration - TypeScript Models
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the Screener component for type safety and consistency.
 */

// ============================================================================
// Symbol and Market Models
// ============================================================================

/**
 * Financial instrument as returned by MetadataController#obtenerSimbolos
 * (GET /marketdata/symbols) — field names match ActiveEquityDTORespuesta 1:1.
 */
export interface Symbol {
  symbol: string;
  description: string;
  listedMarket: string;
}

/**
 * Market as returned by MetadataController#getMarkets (GET /marketdata/markets)
 * — field names match MercadoDTORespuesta 1:1.
 */
export interface Market {
  id: string;
  nombre: string;
}

/**
 * Timeframe as returned by MetadataController#getTimeframes (GET /marketdata/timeframes)
 * — field names match TimeframeDTORespuesta 1:1.
 */
export interface Timeframe {
  id: string;
  codigo: string;
  nombre: string;
}

/**
 * Fundamental data as returned within SymbolDetailsDTORespuesta
 * — field names match domain.models.FundamentalData 1:1.
 */
export interface FundamentalData {
  symbol: string;
  marketCap?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  shortInterest?: number;
  shortRatio?: number;
  dayVolume?: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  openInterest?: number;
  daysUntilEarnings?: number;
  preMarketVolume?: number;
  postMarketVolume?: number;
  nextEarningsDate?: string;
  occurredDate?: string;
  eps?: number;
  dividendAmount?: number;
  dividendFrequency?: string;
  tradingStatus?: string;
  statusReason?: string;
  beta?: number;
  lastUpdated?: string;
  isEtf?: boolean;
  securityType?: string;
  impliedVolatilityIndex?: number;
  impliedVolatilityRank?: number;
  impliedVolatilityPercentile?: number;
  liquidity?: number;
  liquidityRating?: number;
}

/**
 * Response shape of GET /marketdata/symbols/{symbol}/details
 * (SymbolDetailsDTORespuesta) — matches symbol-details.component.html bindings.
 */
export interface SymbolDetails {
  activeEquity: Symbol;
  fundamentalData: FundamentalData;
}

// ============================================================================
// Real-time Data Models
// ============================================================================

/**
 * Real-time snapshot of a symbol's current market data
 * 
 * @interface Snapshot
 * @property {string} symbol - Trading symbol
 * @property {number} price - Current price
 * @property {number} change - Absolute price change
 * @property {number} changePercent - Percentage price change
 * @property {number} volume - Trading volume
 * @property {number} bid - Current bid price
 * @property {number} ask - Current ask price
 * @property {number} bidSize - Size at bid price
 * @property {number} askSize - Size at ask price
 * @property {Date} timestamp - Timestamp of the snapshot
 * @property {'LIVE' | 'DELAYED' | 'CLOSED'} status - Data status
 */
export interface Snapshot {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  timestamp: Date;
  status: 'LIVE' | 'DELAYED' | 'CLOSED';
}

/**
 * Aggregated market metrics and indicators
 * 
 * @interface MarketMetrics
 * @property {number} volatilityIndex - VIX or similar volatility index
 * @property {'UP' | 'DOWN' | 'NEUTRAL'} trend - Overall market trend
 * @property {number} averageVolume - Average trading volume
 * @property {number} marketSentiment - Sentiment score (-1 to 1)
 * @property {Date} timestamp - Timestamp of the metrics
 */
export interface MarketMetrics {
  volatilityIndex: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  averageVolume: number;
  marketSentiment: number;
  timestamp: Date;
}

// ============================================================================
// Option Chain Models
// ============================================================================

/**
 * Complete option chain for a symbol
 * 
 * @interface OptionChain
 * @property {string} symbol - Underlying symbol
 * @property {ExpirationDate[]} expirationDates - Array of expiration dates with options
 * @property {Date} timestamp - Timestamp of the chain
 */
export interface OptionChain {
  symbol: string;
  expirationDates: ExpirationDate[];
  timestamp: Date;
}

/**
 * Options available for a specific expiration date
 * 
 * @interface ExpirationDate
 * @property {Date} date - Expiration date
 * @property {number} daysToExpiration - Number of days until expiration
 * @property {OptionContract[]} options - Array of option contracts
 */
export interface ExpirationDate {
  date: Date;
  daysToExpiration: number;
  options: OptionContract[];
}

/**
 * Individual option contract with Greeks and pricing
 * 
 * @interface OptionContract
 * @property {string} symbol - Option symbol
 * @property {number} strikePrice - Strike price
 * @property {'CALL' | 'PUT'} type - Option type
 * @property {number} bid - Bid price
 * @property {number} ask - Ask price
 * @property {number} volume - Trading volume
 * @property {number} openInterest - Open interest
 * @property {number} impliedVolatility - Implied volatility
 * @property {number} delta - Delta Greek
 * @property {number} gamma - Gamma Greek
 * @property {number} theta - Theta Greek
 * @property {number} vega - Vega Greek
 */
export interface OptionContract {
  symbol: string;
  strikePrice: number;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

// ============================================================================
// Account Models
// ============================================================================

/**
 * Account balance and buying power information
 * 
 * @interface AccountBalance
 * @property {string} accountNumber - Account number
 * @property {number} totalBalance - Total account balance
 * @property {number} buyingPower - Available buying power
 * @property {number} marginUsed - Margin currently used
 * @property {number} marginAvailable - Available margin
 * @property {number} cashBalance - Cash balance
 * @property {Date} timestamp - Timestamp of the balance
 */
export interface AccountBalance {
  accountNumber: string;
  totalBalance: number;
  buyingPower: number;
  marginUsed: number;
  marginAvailable: number;
  cashBalance: number;
  timestamp: Date;
}

// ============================================================================
// API Response Models
// ============================================================================

/**
 * Generic paginated response wrapper
 * 
 * @interface PaginatedResponse
 * @template T - Type of items in the response
 * @property {T[]} data - Array of items
 * @property {number} page - Current page number (1-indexed)
 * @property {number} pageSize - Number of items per page
 * @property {number} totalPages - Total number of pages
 * @property {number} totalElements - Total number of elements
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

/**
 * Health check response from MarketData service
 * 
 * @interface HealthCheckResponse
 * @property {'UP' | 'DOWN'} status - Service status
 * @property {Date} timestamp - Timestamp of the check
 * @property {string} [message] - Optional status message
 */
export interface HealthCheckResponse {
  status: 'UP' | 'DOWN';
  timestamp: Date;
  message?: string;
}

/**
 * Error response from API
 * 
 * @interface ErrorResponse
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {Record<string, any>} [details] - Additional error details
 * @property {Date} timestamp - Timestamp of the error
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// Request Models
// ============================================================================

/**
 * Search request parameters
 * 
 * @interface SearchRequest
 * @property {string} query - Search query string
 * @property {string} [market] - Optional market filter
 * @property {number} [page] - Page number (1-indexed)
 * @property {number} [pageSize] - Items per page
 */
export interface SearchRequest {
  query: string;
  market?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Filter options for symbol search
 * 
 * @interface SymbolFilter
 * @property {string} [market] - Market code filter
 * @property {string} [type] - Symbol type filter
 * @property {string} [sector] - Sector filter
 */
export interface SymbolFilter {
  market?: string;
  type?: string;
  sector?: string;
}
