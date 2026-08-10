export const environment = {
  production: true,
  
  // ============================================================================
  // MarketData Service Endpoints (Production)
  // ============================================================================
  
  // Base URL for MarketData service
  apiUrl: 'https://api.metradingplat.net',
  marketDataUrl: 'https://api.metradingplat.net/marketdata',
  
  // Frontend-specific endpoints (BFF pattern)
  frontendEndpoints: {
    baseUrl: 'https://api.metradingplat.net/api/v1/frontend',
    symbols: 'https://api.metradingplat.net/api/v1/frontend/symbols',
    markets: 'https://api.metradingplat.net/api/v1/frontend/markets',
    health: 'https://api.metradingplat.net/api/v1/frontend/health'
  },
  
  // Real-time data endpoints
  realtimeEndpoints: {
    baseUrl: 'https://api.metradingplat.net/api/v1/realtime',
    snapshot: 'https://api.metradingplat.net/api/v1/realtime/snapshot',
    marketMetrics: 'https://api.metradingplat.net/api/v1/market-metrics'
  },
  
  // Account endpoints
  accountEndpoints: {
    baseUrl: 'https://api.metradingplat.net/api/v1/accounts',
    balances: 'https://api.metradingplat.net/api/v1/accounts'
  },
  
  // Technical Analysis Service
  technicalAnalysisUrl: 'https://api.metradingplat.net/api/v1/analysis',
  
  // ============================================================================
  // HTTP Configuration
  // ============================================================================
  
  // Request timeout in milliseconds
  httpTimeout: 10000,
  
  // Retry configuration
  retry: {
    maxRetries: 2,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  
  // ============================================================================
  // WebSocket Configuration (for future real-time updates)
  // ============================================================================
  
  // WebSocket for real-time data
  websocketUrl: 'wss://api.metradingplat.net/ws',
  
  // ============================================================================
  // Authentication
  // ============================================================================
  
  // Token for SSE authentication
  // IMPORTANT: Change this value on the server using SSE_AUTH_TOKEN environment variable
  sseAuthToken: 'CHANGE_THIS_IN_PRODUCTION'
};