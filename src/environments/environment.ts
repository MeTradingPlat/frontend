export const environment = {
  production: false,
  
  // ✅ Frontend NUNCA habla con Tastytrade
  // ✅ Frontend habla con MarketData Service (Java) como API Gateway/BFF
  apiUrl: 'http://localhost:8080',
  
  // ============================================================================
  // MarketData Service Endpoints
  // ============================================================================
  
  // Base URL for MarketData service
  marketDataUrl: 'http://localhost:8080/marketdata',
  
  // Frontend-specific endpoints (BFF pattern)
  frontendEndpoints: {
    baseUrl: 'http://localhost:8080/api/v1/frontend',
    symbols: 'http://localhost:8080/api/v1/frontend/symbols',
    markets: 'http://localhost:8080/api/v1/frontend/markets',
    health: 'http://localhost:8080/api/v1/frontend/health'
  },
  
  // Real-time data endpoints
  realtimeEndpoints: {
    baseUrl: 'http://localhost:8080/api/v1/realtime',
    snapshot: 'http://localhost:8080/api/v1/realtime/snapshot',
    marketMetrics: 'http://localhost:8080/api/v1/market-metrics'
  },
  
  // Account endpoints
  accountEndpoints: {
    baseUrl: 'http://localhost:8080/api/v1/accounts',
    balances: 'http://localhost:8080/api/v1/accounts'
  },
  
  // Option chain endpoints
  optionEndpoints: {
    baseUrl: 'http://localhost:8080/api/v1/option-chains',
    nested: 'http://localhost:8080/api/v1/option-chains'
  },
  
  // Technical Analysis Service (if applicable)
  technicalAnalysisUrl: 'http://localhost:8000/api/v1/analysis',
  
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
  
  // WebSocket for real-time data (Phase 3)
  websocketUrl: 'ws://localhost:8080/ws',
  
  // ============================================================================
  // Authentication
  // ============================================================================
  
  // Token for SSE authentication (must match SSE_AUTH_TOKEN in backend)
  // TODO: Implement JWT authentication for dynamic per-user tokens
  sseAuthToken: 'CHANGE_THIS_IN_PRODUCTION'
};