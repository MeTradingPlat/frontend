/**
 * Cache Configuration Constants
 * 
 * This file defines all cache-related constants including TTL values,
 * size limits, and LRU eviction policies for the Screener component.
 */

// ============================================================================
// Cache TTL (Time-To-Live) Configuration
// ============================================================================

/**
 * TTL values in milliseconds for different types of cached data
 * 
 * These values determine how long data remains in cache before expiration.
 * Shorter TTLs ensure fresher data but increase API calls.
 * Longer TTLs reduce API calls but may serve stale data.
 */
export const CACHE_TTL = {
  /**
   * Symbol search results TTL: 5 minutes
   * 
   * Search results are cached for 5 minutes to avoid repeated API calls
   * for the same search query within a short time window.
   */
  SYMBOLS_SEARCH: 5 * 60 * 1000, // 5 minutes

  /**
   * Markets list TTL: 1 hour
   * 
   * Markets list is relatively static and cached for 1 hour.
   * Markets rarely change during a trading session.
   */
  MARKETS: 60 * 60 * 1000, // 1 hour

  /**
   * Symbol details TTL: 10 minutes
   * 
   * Fundamental data like sector, industry, market cap changes infrequently.
   * Cached for 10 minutes to balance freshness and performance.
   */
  SYMBOL_DETAILS: 10 * 60 * 1000, // 10 minutes

  /**
   * Real-time snapshot TTL: 30 seconds
   * 
   * Snapshots are real-time data and cached for only 30 seconds.
   * This ensures users see relatively fresh price data.
   */
  SNAPSHOT: 30 * 1000, // 30 seconds

  /**
   * Market metrics TTL: 5 minutes
   * 
   * Aggregated market metrics like volatility index are cached for 5 minutes.
   * These metrics update periodically and don't need to be fetched constantly.
   */
  MARKET_METRICS: 5 * 60 * 1000, // 5 minutes

  /**
   * Option chain TTL: 15 minutes
   * 
   * Option chains are relatively stable and cached for 15 minutes.
   * New options are added infrequently during a trading day.
   */
  OPTION_CHAIN: 15 * 60 * 1000, // 15 minutes

  /**
   * Account balance TTL: 5 minutes
   * 
   * Account balance is cached for 5 minutes to reduce API calls
   * while keeping the balance reasonably up-to-date.
   */
  ACCOUNT_BALANCE: 5 * 60 * 1000, // 5 minutes

  /**
   * Health check TTL: 30 seconds
   * 
   * Health check results are cached for 30 seconds to avoid
   * excessive health check calls while still detecting outages quickly.
   */
  HEALTH_CHECK: 30 * 1000 // 30 seconds
} as const;

// ============================================================================
// Cache Size Configuration
// ============================================================================

/**
 * Maximum cache size in bytes
 * 
 * When the cache exceeds this size, LRU (Least Recently Used) eviction
 * is triggered to remove the least recently accessed entries.
 */
export const CACHE_MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Individual cache entry size limits in bytes
 * 
 * Prevents a single entry from consuming too much cache space.
 * Entries larger than this limit are not cached.
 */
export const CACHE_ENTRY_SIZE_LIMITS = {
  SYMBOLS_SEARCH: 20 * 1024 * 1024, // 20 MB
  MARKETS: 1 * 1024 * 1024, // 1 MB
  SYMBOL_DETAILS: 10 * 1024 * 1024, // 10 MB
  SNAPSHOT: 15 * 1024 * 1024, // 15 MB
  MARKET_METRICS: 2 * 1024 * 1024, // 2 MB
  OPTION_CHAIN: 10 * 1024 * 1024, // 10 MB
  ACCOUNT_BALANCE: 1 * 1024 * 1024 // 1 MB
} as const;

// ============================================================================
// LRU Eviction Configuration
// ============================================================================

/**
 * LRU eviction threshold percentage
 * 
 * When cache size exceeds this percentage of max size,
 * LRU eviction is triggered.
 * 
 * Example: If max size is 50MB and threshold is 0.9,
 * eviction starts when cache reaches 45MB.
 */
export const LRU_EVICTION_THRESHOLD = 0.9; // 90% of max size

/**
 * Number of entries to evict per LRU cycle
 * 
 * When LRU eviction is triggered, this many least recently used
 * entries are removed from the cache.
 */
export const LRU_EVICTION_BATCH_SIZE = 10;

/**
 * Minimum cache entries to keep
 * 
 * Even during LRU eviction, at least this many entries
 * are kept in the cache.
 */
export const LRU_MIN_ENTRIES = 5;

// ============================================================================
// Cache Key Prefixes
// ============================================================================

/**
 * Cache key prefixes for different data types
 * 
 * These prefixes are used to namespace cache keys and make them
 * more readable and easier to debug.
 */
export const CACHE_KEY_PREFIX = {
  SYMBOLS_SEARCH: 'screener:symbols:search:',
  MARKETS: 'screener:markets:',
  SYMBOL_DETAILS: 'screener:symbol:details:',
  SNAPSHOT: 'screener:snapshot:',
  MARKET_METRICS: 'screener:metrics:',
  OPTION_CHAIN: 'screener:options:',
  ACCOUNT_BALANCE: 'screener:account:balance:',
  HEALTH_CHECK: 'screener:health:'
} as const;

// ============================================================================
// Cache Statistics Configuration
// ============================================================================

/**
 * Enable cache statistics tracking
 * 
 * When enabled, the cache service tracks hit/miss rates,
 * eviction counts, and other metrics for monitoring.
 */
export const CACHE_STATS_ENABLED = true;

/**
 * Cache statistics update interval in milliseconds
 * 
 * Statistics are recalculated at this interval.
 */
export const CACHE_STATS_UPDATE_INTERVAL = 60 * 1000; // 1 minute

// ============================================================================
// Cache Invalidation Configuration
// ============================================================================

/**
 * Automatic cache invalidation patterns
 * 
 * These patterns define which cache entries should be invalidated
 * when certain events occur (e.g., user logout, market close).
 */
export const CACHE_INVALIDATION_PATTERNS = {
  /**
   * Invalidate all cache on user logout
   */
  ON_LOGOUT: '*',

  /**
   * Invalidate account-related cache on balance update
   */
  ON_BALANCE_UPDATE: 'screener:account:*',

  /**
   * Invalidate snapshot cache on market close
   */
  ON_MARKET_CLOSE: 'screener:snapshot:*',

  /**
   * Invalidate option chain cache on expiration date change
   */
  ON_EXPIRATION_CHANGE: 'screener:options:*'
} as const;

// ============================================================================
// Cache Preload Configuration
// ============================================================================

/**
 * Data to preload into cache on application startup
 * 
 * These items are fetched and cached immediately when the app loads
 * to improve perceived performance.
 */
export const CACHE_PRELOAD_ITEMS = [
  'markets', // Preload markets list
  'health'   // Preload health check
] as const;

// ============================================================================
// Cache Debugging Configuration
// ============================================================================

/**
 * Enable cache debugging
 * 
 * When enabled, cache operations are logged to the console
 * for debugging and monitoring purposes.
 */
export const CACHE_DEBUG_ENABLED = false;

/**
 * Log cache operations
 * 
 * When enabled, all cache get/set/delete operations are logged.
 */
export const CACHE_LOG_OPERATIONS = false;

/**
 * Log cache evictions
 * 
 * When enabled, LRU eviction events are logged.
 */
export const CACHE_LOG_EVICTIONS = false;

/**
 * Log cache statistics
 * 
 * When enabled, cache statistics are logged periodically.
 */
export const CACHE_LOG_STATISTICS = false;

// ============================================================================
// Cache Validation Configuration
// ============================================================================

/**
 * Validate cache entries on retrieval
 * 
 * When enabled, cache entries are validated before being returned
 * to ensure they haven't been corrupted.
 */
export const CACHE_VALIDATE_ON_GET = true;

/**
 * Validate cache entries on storage
 * 
 * When enabled, cache entries are validated before being stored
 * to ensure they meet size and format requirements.
 */
export const CACHE_VALIDATE_ON_SET = true;

// ============================================================================
// Cache Compression Configuration
// ============================================================================

/**
 * Enable cache compression
 * 
 * When enabled, large cache entries are compressed to save memory.
 * Compression adds CPU overhead but reduces memory usage.
 */
export const CACHE_COMPRESSION_ENABLED = false;

/**
 * Minimum entry size for compression in bytes
 * 
 * Only entries larger than this size are compressed.
 */
export const CACHE_COMPRESSION_MIN_SIZE = 10 * 1024; // 10 KB

// ============================================================================
// Cache Persistence Configuration
// ============================================================================

/**
 * Enable cache persistence to localStorage
 * 
 * When enabled, cache is persisted to browser localStorage
 * and restored on page reload.
 */
export const CACHE_PERSISTENCE_ENABLED = false;

/**
 * Cache persistence key in localStorage
 */
export const CACHE_PERSISTENCE_KEY = 'screener:cache:v1';

/**
 * Maximum age for persisted cache in milliseconds
 * 
 * Persisted cache older than this is discarded on restore.
 */
export const CACHE_PERSISTENCE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
