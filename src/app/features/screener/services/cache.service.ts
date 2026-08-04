import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  CACHE_MAX_SIZE_BYTES,
  LRU_EVICTION_THRESHOLD,
  LRU_EVICTION_BATCH_SIZE,
  LRU_MIN_ENTRIES,
  CACHE_STATS_ENABLED,
  CACHE_STATS_UPDATE_INTERVAL,
  CACHE_DEBUG_ENABLED,
  CACHE_LOG_OPERATIONS,
  CACHE_LOG_EVICTIONS,
  CACHE_LOG_STATISTICS
} from '../constants/cache.constants';

/**
 * CacheEntry Interface
 * 
 * Represents a single entry in the cache with metadata for TTL and LRU tracking.
 */
export interface CacheEntry<T> {
  /** Unique key for the cache entry */
  key: string;

  /** The cached value */
  value: T;

  /** Timestamp when the entry expires */
  expiresAt: Date;

  /** Timestamp when the entry was created */
  createdAt: Date;

  /** Timestamp of the last access to this entry */
  lastAccessedAt: Date;

  /** Number of times this entry has been accessed */
  accessCount: number;

  /** Size of the entry in bytes */
  sizeBytes: number;
}

/**
 * CacheStats Interface
 * 
 * Statistics about cache performance and usage.
 */
export interface CacheStats {
  /** Total number of entries in the cache */
  totalEntries: number;

  /** Total size of cache in bytes */
  totalSizeBytes: number;

  /** Cache hit rate (0-1) */
  hitRate: number;

  /** Cache miss rate (0-1) */
  missRate: number;

  /** Number of LRU evictions performed */
  evictionCount: number;

  /** Total number of cache hits */
  totalHits: number;

  /** Total number of cache misses */
  totalMisses: number;

  /** Average entry size in bytes */
  averageEntrySize: number;

  /** Timestamp of last statistics update */
  lastUpdated: Date;
}

/**
 * CacheService
 * 
 * Provides in-memory caching with LRU (Least Recently Used) eviction policy
 * and TTL (Time-To-Live) expiration management.
 * 
 * Features:
 * - Generic type-safe caching
 * - Automatic TTL expiration
 * - LRU eviction when size limit exceeded
 * - Cache statistics tracking
 * - Debug logging support
 * 
 * @example
 * ```typescript
 * constructor(private cache: CacheService) {}
 * 
 * // Set a value with 5 minute TTL
 * this.cache.set('my-key', { data: 'value' }, 5 * 60 * 1000);
 * 
 * // Get a value
 * const value = this.cache.get<MyType>('my-key');
 * 
 * // Check if key exists
 * if (this.cache.has('my-key')) {
 *   // ...
 * }
 * 
 * // Delete a specific key
 * this.cache.delete('my-key');
 * 
 * // Clear entire cache
 * this.cache.clear();
 * 
 * // Get statistics
 * const stats = this.cache.getStats();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService implements OnDestroy {
  /** Internal cache storage */
  private cache: Map<string, CacheEntry<any>> = new Map();

  /** Current total size of cache in bytes */
  private currentSizeBytes: number = 0;

  /** Maximum allowed cache size in bytes */
  private maxSizeBytes: number = CACHE_MAX_SIZE_BYTES;

  /** Statistics tracking */
  private stats = {
    totalHits: 0,
    totalMisses: 0,
    evictionCount: 0
  };

  /** Statistics observable */
  private stats$ = new BehaviorSubject<CacheStats>(this.calculateStats());

  /** Statistics update interval */
  private statsUpdateInterval: any;

  constructor() {
    this.initializeStatsTracking();
  }

  /**
   * Initialize periodic statistics tracking
   */
  private initializeStatsTracking(): void {
    if (CACHE_STATS_ENABLED) {
      this.statsUpdateInterval = setInterval(() => {
        this.stats$.next(this.calculateStats());
        if (CACHE_LOG_STATISTICS) {
          this.log('Cache Statistics:', this.stats$.value);
        }
      }, CACHE_STATS_UPDATE_INTERVAL);
    }
  }

  /**
   * Get a value from the cache
   * 
   * @param key - The cache key
   * @returns The cached value or null if not found or expired
   * 
   * @example
   * ```typescript
   * const value = this.cache.get<MyType>('my-key');
   * ```
   */
  get<T>(key: string): T | null {
    // Remove expired entries first
    this.removeExpired();

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.totalMisses++;
      this.logOperation('GET', key, false);
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.currentSizeBytes -= entry.sizeBytes;
      this.stats.totalMisses++;
      this.logOperation('GET', key, false, 'expired');
      return null;
    }

    // Update access metadata
    entry.lastAccessedAt = new Date();
    entry.accessCount++;

    this.stats.totalHits++;
    this.logOperation('GET', key, true);

    return entry.value as T;
  }

  /**
   * Set a value in the cache
   * 
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttlMs - Time-to-live in milliseconds
   * 
   * @example
   * ```typescript
   * this.cache.set('my-key', { data: 'value' }, 5 * 60 * 1000);
   * ```
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    // Remove expired entries first
    this.removeExpired();

    // Calculate size of the new entry
    const sizeBytes = this.calculateSize(value);

    // If entry already exists, subtract its size
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSizeBytes -= oldEntry.sizeBytes;
    }

    // Create new cache entry
    const now = new Date();
    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: new Date(now.getTime() + ttlMs),
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      sizeBytes
    };

    // Add to cache
    this.cache.set(key, entry);
    this.currentSizeBytes += sizeBytes;

    this.logOperation('SET', key, true, `size: ${sizeBytes} bytes`);

    // Check if eviction is needed
    if (this.shouldEvict()) {
      this.evictLRU();
    }
  }

  /**
   * Check if a key exists in the cache
   * 
   * @param key - The cache key
   * @returns true if key exists and is not expired
   * 
   * @example
   * ```typescript
   * if (this.cache.has('my-key')) {
   *   // ...
   * }
   * ```
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.currentSizeBytes -= entry.sizeBytes;
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key from the cache
   * 
   * @param key - The cache key to delete
   * 
   * @example
   * ```typescript
   * this.cache.delete('my-key');
   * ```
   */
  delete(key: string): void {
    const entry = this.cache.get(key);

    if (entry) {
      this.cache.delete(key);
      this.currentSizeBytes -= entry.sizeBytes;
      this.logOperation('DELETE', key, true);
    } else {
      this.logOperation('DELETE', key, false, 'not found');
    }
  }

  /**
   * Clear all entries from the cache
   * 
   * @example
   * ```typescript
   * this.cache.clear();
   * ```
   */
  clear(): void {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.currentSizeBytes = 0;
    this.log(`Cache cleared. Removed ${entriesCount} entries.`);
  }

  /**
   * Get cache statistics
   * 
   * @returns CacheStats object with current cache metrics
   * 
   * @example
   * ```typescript
   * const stats = this.cache.getStats();
   * console.log(`Hit rate: ${stats.hitRate}`);
   * ```
   */
  getStats(): CacheStats {
    return this.calculateStats();
  }

  /**
   * Get cache statistics as observable
   * 
   * @returns Observable of cache statistics
   */
  getStats$(): Observable<CacheStats> {
    return this.stats$.asObservable();
  }

  /**
   * Get hit rate (0-1)
   * 
   * @returns Hit rate percentage
   */
  getHitRate(): number {
    const total = this.stats.totalHits + this.stats.totalMisses;
    return total === 0 ? 0 : this.stats.totalHits / total;
  }

  /**
   * Get current cache size in bytes
   * 
   * @returns Current size in bytes
   */
  getCurrentSize(): number {
    return this.currentSizeBytes;
  }

  /**
   * Get maximum cache size in bytes
   * 
   * @returns Maximum size in bytes
   */
  getMaxSize(): number {
    return this.maxSizeBytes;
  }

  /**
   * Get number of entries in cache
   * 
   * @returns Number of entries
   */
  getEntryCount(): number {
    return this.cache.size;
  }

  /**
   * Check if an entry has expired
   * 
   * @param entry - The cache entry to check
   * @returns true if entry has expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * Remove all expired entries from the cache
   */
  private removeExpired(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.cache.get(key)!;
      this.cache.delete(key);
      this.currentSizeBytes -= entry.sizeBytes;
      this.logOperation('EXPIRE', key, true);
    }

    if (expiredKeys.length > 0 && CACHE_LOG_OPERATIONS) {
      this.log(`Removed ${expiredKeys.length} expired entries.`);
    }
  }

  /**
   * Check if LRU eviction should be triggered
   * 
   * @returns true if cache size exceeds threshold
   */
  private shouldEvict(): boolean {
    const threshold = this.maxSizeBytes * LRU_EVICTION_THRESHOLD;
    return this.currentSizeBytes > threshold;
  }

  /**
   * Evict least recently used entries
   * 
   * Removes the least recently used entries until cache size
   * is below the threshold.
   */
  private evictLRU(): void {
    const entriesToEvict: Array<[string, CacheEntry<any>]> = Array.from(
      this.cache.entries()
    ).sort((a, b) => {
      // Sort by lastAccessedAt (ascending) - least recently used first
      return a[1].lastAccessedAt.getTime() - b[1].lastAccessedAt.getTime();
    });

    let evictedCount = 0;
    const maxEvictions = Math.min(
      LRU_EVICTION_BATCH_SIZE,
      Math.max(0, this.cache.size - LRU_MIN_ENTRIES)
    );

    for (let i = 0; i < maxEvictions && this.shouldEvict(); i++) {
      const [key, entry] = entriesToEvict[i];
      this.cache.delete(key);
      this.currentSizeBytes -= entry.sizeBytes;
      evictedCount++;
      this.logOperation('EVICT', key, true);
    }

    this.stats.evictionCount++;

    if (evictedCount > 0) {
      this.log(
        `LRU Eviction: Removed ${evictedCount} entries. ` +
        `Cache size: ${this.formatBytes(this.currentSizeBytes)} / ${this.formatBytes(this.maxSizeBytes)}`
      );
      if (CACHE_LOG_EVICTIONS) {
        this.log(`Eviction count: ${this.stats.evictionCount}`);
      }
    }
  }

  /**
   * Calculate the size of a value in bytes
   * 
   * Uses JSON serialization to estimate size.
   * 
   * @param value - The value to measure
   * @returns Size in bytes
   */
  private calculateSize(value: any): number {
    try {
      const json = JSON.stringify(value);
      // Each character is approximately 1 byte in UTF-8
      return json.length;
    } catch (error) {
      // If serialization fails, estimate based on type
      if (typeof value === 'string') {
        return value.length;
      }
      if (typeof value === 'number') {
        return 8;
      }
      if (typeof value === 'boolean') {
        return 4;
      }
      // Default estimate for objects
      return 1024;
    }
  }

  /**
   * Calculate current cache statistics
   * 
   * @returns CacheStats object
   */
  private calculateStats(): CacheStats {
    const total = this.stats.totalHits + this.stats.totalMisses;
    const hitRate = total === 0 ? 0 : this.stats.totalHits / total;
    const missRate = total === 0 ? 0 : this.stats.totalMisses / total;
    const averageEntrySize =
      this.cache.size === 0 ? 0 : this.currentSizeBytes / this.cache.size;

    return {
      totalEntries: this.cache.size,
      totalSizeBytes: this.currentSizeBytes,
      hitRate,
      missRate,
      evictionCount: this.stats.evictionCount,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
      averageEntrySize,
      lastUpdated: new Date()
    };
  }

  /**
   * Log a cache operation
   * 
   * @param operation - Operation type (GET, SET, DELETE, etc.)
   * @param key - Cache key
   * @param success - Whether operation was successful
   * @param details - Additional details
   */
  private logOperation(
    operation: string,
    key: string,
    success: boolean,
    details?: string
  ): void {
    if (!CACHE_LOG_OPERATIONS || !CACHE_DEBUG_ENABLED) {
      return;
    }

    const status = success ? '✓' : '✗';
    const detailsStr = details ? ` (${details})` : '';
    this.log(`[${operation}] ${status} ${key}${detailsStr}`);
  }

  /**
   * Log a message to console
   * 
   * @param message - Message to log
   * @param data - Optional data to log
   */
  private log(message: string, data?: any): void {
    if (!CACHE_DEBUG_ENABLED) {
      return;
    }

    if (data) {
      console.log(`[CacheService] ${message}`, data);
    } else {
      console.log(`[CacheService] ${message}`);
    }
  }

  /**
   * Format bytes to human-readable format
   * 
   * @param bytes - Number of bytes
   * @returns Formatted string (e.g., "1.5 MB")
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }
  }
}
