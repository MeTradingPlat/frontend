export interface Market {
  id: string;
  nombre: string;
}

export interface SymbolSummary {
  symbol: string;
  description: string;
  listedMarket: string;
}

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
  haltStartTime?: number;
  haltEndTime?: number;
  beta?: number;
  lastEarningsUpdated?: string;
  lastShortInterestUpdated?: string;
  lastUpdated?: string;
  impliedVolatilityIndex?: number;
  impliedVolatilityRank?: number;
  impliedVolatilityPercentile?: number;
  liquidity?: number;
  liquidityRating?: number;
}

export interface SymbolDetails {
  activeEquity: SymbolSummary;
  fundamentalData: FundamentalData;
}
