import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CacheService, CacheEntry, CacheStats } from './cache.service';
import * as cacheConstants from '../constants/cache.constants';

/**
 * Unit Tests for CacheService
 * 
 * Tests cover:
 * - Cache hit/miss scenarios
 * - TTL expiration
 * - LRU eviction
 * - Size limit enforcement
 * - Statistics tracking
 * - Edge cases and error handling
 * 
 * Target Coverage: 90%
 */
describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService]
    });
    service = TestBed.inject(CacheService);
  });

  afterEach(() => {
    service.clear();
  });

  // ============================================================================
  // Basic Cache Operations Tests
  // ============================================================================

  describe('Basic Cache Operations', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should set and get a value', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 5 * 60 * 1000; // 5 minutes

      service.set(key, value, ttl);
      const result = service.get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      service.set(key, value, 5 * 60 * 1000);
      expect(service.has(key)).toBe(true);
      expect(service.has('non-existent')).toBe(false);
    });

    it('should delete a key', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      service.set(key, value, 5 * 60 * 1000);
      expect(service.has(key)).toBe(true);

      service.delete(key);
      expect(service.has(key)).toBe(false);
    });

    it('should delete non-existent key without error', () => {
      expect(() => service.delete('non-existent')).not.toThrow();
    });

    it('should clear all entries', () => {
      service.set('key1', { data: 1 }, 5 * 60 * 1000);
      service.set('key2', { data: 2 }, 5 * 60 * 1000);
      service.set('key3', { data: 3 }, 5 * 60 * 1000);

      expect(service.getEntryCount()).toBe(3);

      service.clear();
      expect(service.getEntryCount()).toBe(0);
      expect(service.getCurrentSize()).toBe(0);
    });
  });

  // ============================================================================
  // Cache Hit/Miss Tests
  // ============================================================================

  describe('Cache Hit/Miss Scenarios', () => {
    it('should track cache hits', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      service.set(key, value, 5 * 60 * 1000);
      service.get(key);
      service.get(key);

      const stats = service.getStats();
      expect(stats.totalHits).toBe(2);
    });

    it('should track cache misses', () => {
      service.get('non-existent-1');
      service.get('non-existent-2');

      const stats = service.getStats();
      expect(stats.totalMisses).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      service.set(key, value, 5 * 60 * 1000);
      service.get(key); // hit
      service.get(key); // hit
      service.get('non-existent'); // miss

      const hitRate = service.getHitRate();
      expect(hitRate).toBeCloseTo(2 / 3, 2);
    });

    it('should return 0 hit rate when no accesses', () => {
      const hitRate = service.getHitRate();
      expect(hitRate).toBe(0);
    });

    it('should calculate miss rate correctly', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      service.set(key, value, 5 * 60 * 1000);
      service.get(key); // hit
      service.get('non-existent'); // miss
      service.get('non-existent-2'); // miss

      const stats = service.getStats();
      expect(stats.missRate).toBeCloseTo(2 / 3, 2);
    });
  });

  // ============================================================================
  // TTL Expiration Tests
  // ============================================================================

  describe('TTL Expiration', () => {
    it('should expire entry after TTL', fakeAsync(() => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 1000; // 1 second

      service.set(key, value, ttl);
      expect(service.get(key)).toEqual(value);

      tick(1100); // Wait for expiration

      expect(service.get(key)).toBeNull();
    }));

    it('should not expire entry before TTL', fakeAsync(() => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 2000; // 2 seconds

      service.set(key, value, ttl);
      tick(1000); // Wait 1 second

      expect(service.get(key)).toEqual(value);
    }));

    it('should remove expired entries on get', fakeAsync(() => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 1000;

      service.set(key, value, ttl);
      tick(1100);

      service.get(key); // Should trigger cleanup

      expect(service.getEntryCount()).toBe(0);
    }));

    it('should remove expired entries on set', fakeAsync(() => {
      const key1 = 'test-key-1';
      const key2 = 'test-key-2';
      const value = { data: 'test' };
      const ttl = 1000;

      service.set(key1, value, ttl);
      tick(1100);

      service.set(key2, value, 5 * 60 * 1000); // Should trigger cleanup

      expect(service.getEntryCount()).toBe(1);
      expect(service.has(key1)).toBe(false);
      expect(service.has(key2)).toBe(true);
    }));

    it('should return false for has() on expired entry', fakeAsync(() => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 1000;

      service.set(key, value, ttl);
      tick(1100);

      expect(service.has(key)).toBe(false);
    }));
  });

  // ============================================================================
  // Size Calculation Tests
  // ============================================================================

  describe('Size Calculation', () => {
    it('should calculate size for objects', () => {
      const key = 'test-key';
      const value = { data: 'test', number: 123 };

      service.set(key, value, 5 * 60 * 1000);
      const size = service.getCurrentSize();

      expect(size).toBeGreaterThan(0);
    });

    it('should calculate size for strings', () => {
      const key = 'test-key';
      const value = 'test-string-value';

      service.set(key, value, 5 * 60 * 1000);
      const size = service.getCurrentSize();

      expect(size).toBeGreaterThan(0);
    });

    it('should calculate size for arrays', () => {
      const key = 'test-key';
      const value = [1, 2, 3, 4, 5];

      service.set(key, value, 5 * 60 * 1000);
      const size = service.getCurrentSize();

      expect(size).toBeGreaterThan(0);
    });

    it('should calculate size for numbers', () => {
      const key = 'test-key';
      const value = 12345;

      service.set(key, value, 5 * 60 * 1000);
      const size = service.getCurrentSize();

      expect(size).toBeGreaterThan(0);
    });

    it('should calculate size for booleans', () => {
      const key = 'test-key';
      const value = true;

      service.set(key, value, 5 * 60 * 1000);
      const size = service.getCurrentSize();

      expect(size).toBeGreaterThan(0);
    });

    it('should update size when replacing entry', () => {
      const key = 'test-key';
      const value1 = { data: 'short' };
      const value2 = { data: 'much longer value' };

      service.set(key, value1, 5 * 60 * 1000);
      const size1 = service.getCurrentSize();

      service.set(key, value2, 5 * 60 * 1000);
      const size2 = service.getCurrentSize();

      expect(size2).toBeGreaterThan(size1);
    });
  });

  // ============================================================================
  // LRU Eviction Tests
  // ============================================================================

  describe('LRU Eviction', () => {
    it('should trigger eviction when cache exceeds threshold', () => {
      // Create large entries to trigger eviction
      const largeValue = new Array(1000).fill('x').join('');
      const ttl = 5 * 60 * 1000;

      // Fill cache beyond threshold
      for (let i = 0; i < 100; i++) {
        service.set(`key-${i}`, largeValue, ttl);
      }

      const stats = service.getStats();
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should evict least recently used entries', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      // Add entries
      service.set('key-1', value, ttl);
      service.set('key-2', value, ttl);
      service.set('key-3', value, ttl);

      // Access key-1 and key-2 to make them recently used
      service.get('key-1');
      service.get('key-2');

      // Create large entries to trigger eviction
      const largeValue = new Array(10000).fill('x').join('');
      for (let i = 0; i < 50; i++) {
        service.set(`large-key-${i}`, largeValue, ttl);
      }

      // key-3 should be evicted (least recently used)
      expect(service.has('key-3')).toBe(false);
    });

    it('should maintain minimum entries during eviction', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      // Add entries
      for (let i = 0; i < 10; i++) {
        service.set(`key-${i}`, value, ttl);
      }

      // Create large entries to trigger eviction
      const largeValue = new Array(10000).fill('x').join('');
      for (let i = 0; i < 100; i++) {
        service.set(`large-key-${i}`, largeValue, ttl);
      }

      // Should maintain at least LRU_MIN_ENTRIES
      expect(service.getEntryCount()).toBeGreaterThanOrEqual(
        cacheConstants.LRU_MIN_ENTRIES
      );
    });

    it('should evict batch size entries per cycle', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      // Add entries
      for (let i = 0; i < 20; i++) {
        service.set(`key-${i}`, value, ttl);
      }

      const initialCount = service.getEntryCount();
      const initialStats = service.getStats();

      // Create large entries to trigger eviction
      const largeValue = new Array(10000).fill('x').join('');
      service.set('large-key', largeValue, ttl);

      const finalStats = service.getStats();
      const evictionsTriggered = finalStats.evictionCount - initialStats.evictionCount;

      expect(evictionsTriggered).toBeGreaterThan(0);
    });

    it('should not evict if cache is below threshold', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('key-1', value, ttl);
      service.set('key-2', value, ttl);

      const stats = service.getStats();
      expect(stats.evictionCount).toBe(0);
    });
  });

  // ============================================================================
  // Cache Size Limit Tests
  // ============================================================================

  describe('Cache Size Limits', () => {
    it('should respect maximum cache size', () => {
      const largeValue = new Array(1000).fill('x').join('');
      const ttl = 5 * 60 * 1000;

      for (let i = 0; i < 200; i++) {
        service.set(`key-${i}`, largeValue, ttl);
      }

      expect(service.getCurrentSize()).toBeLessThanOrEqual(
        service.getMaxSize()
      );
    });

    it('should return current size', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('key-1', value, ttl);
      const size1 = service.getCurrentSize();

      service.set('key-2', value, ttl);
      const size2 = service.getCurrentSize();

      expect(size2).toBeGreaterThan(size1);
    });

    it('should return maximum size', () => {
      expect(service.getMaxSize()).toBe(cacheConstants.CACHE_MAX_SIZE_BYTES);
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('Cache Statistics', () => {
    it('should return cache stats', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('key-1', value, ttl);
      service.get('key-1');
      service.get('non-existent');

      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalEntries).toBe(1);
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.missRate).toBeGreaterThan(0);
      expect(stats.totalHits).toBe(1);
      expect(stats.totalMisses).toBe(1);
    });

    it('should calculate average entry size', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('key-1', value, ttl);
      service.set('key-2', value, ttl);

      const stats = service.getStats();
      expect(stats.averageEntrySize).toBeGreaterThan(0);
    });

    it('should return 0 average entry size when cache is empty', () => {
      const stats = service.getStats();
      expect(stats.averageEntrySize).toBe(0);
    });

    it('should track eviction count', () => {
      const largeValue = new Array(1000).fill('x').join('');
      const ttl = 5 * 60 * 1000;

      for (let i = 0; i < 100; i++) {
        service.set(`key-${i}`, largeValue, ttl);
      }

      const stats = service.getStats();
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should provide stats as observable', (done) => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('key-1', value, ttl);

      service.getStats$().subscribe((stats) => {
        expect(stats).toBeDefined();
        expect(stats.totalEntries).toBeGreaterThan(0);
        done();
      });
    });

    it('should update stats timestamp', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('key-1', value, ttl);
      const stats = service.getStats();

      expect(stats.lastUpdated).toBeDefined();
      expect(stats.lastUpdated instanceof Date).toBe(true);
    });
  });

  // ============================================================================
  // Entry Count Tests
  // ============================================================================

  describe('Entry Count', () => {
    it('should return correct entry count', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      expect(service.getEntryCount()).toBe(0);

      service.set('key-1', value, ttl);
      expect(service.getEntryCount()).toBe(1);

      service.set('key-2', value, ttl);
      expect(service.getEntryCount()).toBe(2);

      service.delete('key-1');
      expect(service.getEntryCount()).toBe(1);
    });

    it('should decrease entry count on expiration', fakeAsync(() => {
      const value = { data: 'test' };
      const ttl = 1000;

      service.set('key-1', value, ttl);
      expect(service.getEntryCount()).toBe(1);

      tick(1100);
      service.get('key-1'); // Trigger cleanup

      expect(service.getEntryCount()).toBe(0);
    }));
  });

  // ============================================================================
  // Generic Type Safety Tests
  // ============================================================================

  describe('Generic Type Safety', () => {
    it('should handle different data types', () => {
      const ttl = 5 * 60 * 1000;

      // String
      service.set('string-key', 'test-string', ttl);
      expect(service.get<string>('string-key')).toBe('test-string');

      // Number
      service.set('number-key', 42, ttl);
      expect(service.get<number>('number-key')).toBe(42);

      // Boolean
      service.set('boolean-key', true, ttl);
      expect(service.get<boolean>('boolean-key')).toBe(true);

      // Array
      const array = [1, 2, 3];
      service.set('array-key', array, ttl);
      expect(service.get<number[]>('array-key')).toEqual(array);

      // Object
      const obj = { name: 'test', value: 123 };
      service.set('object-key', obj, ttl);
      expect(service.get<typeof obj>('object-key')).toEqual(obj);
    });

    it('should handle complex nested objects', () => {
      const ttl = 5 * 60 * 1000;
      const complexObj = {
        user: {
          id: 1,
          name: 'Test User',
          roles: ['admin', 'user'],
          metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          }
        },
        data: [
          { id: 1, value: 'a' },
          { id: 2, value: 'b' }
        ]
      };

      service.set('complex-key', complexObj, ttl);
      const result = service.get<typeof complexObj>('complex-key');

      expect(result).toEqual(complexObj);
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty string key', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('', value, ttl);
      expect(service.get('')).toEqual(value);
    });

    it('should handle null value', () => {
      const ttl = 5 * 60 * 1000;

      service.set('null-key', null, ttl);
      expect(service.get('null-key')).toBeNull();
    });

    it('should handle undefined value', () => {
      const ttl = 5 * 60 * 1000;

      service.set('undefined-key', undefined, ttl);
      const result = service.get('undefined-key');
      expect(result).toBeUndefined();
    });

    it('should handle very large values', () => {
      const largeValue = new Array(100000).fill('x').join('');
      const ttl = 5 * 60 * 1000;

      service.set('large-key', largeValue, ttl);
      const result = service.get<string>('large-key');

      expect(result).toBe(largeValue);
    });

    it('should handle zero TTL', fakeAsync(() => {
      const value = { data: 'test' };
      const ttl = 0;

      service.set('zero-ttl-key', value, ttl);
      tick(1);

      expect(service.get('zero-ttl-key')).toBeNull();
    }));

    it('should handle very long TTL', fakeAsync(() => {
      const value = { data: 'test' };
      const ttl = 365 * 24 * 60 * 60 * 1000; // 1 year

      service.set('long-ttl-key', value, ttl);
      tick(1000);

      expect(service.get('long-ttl-key')).toEqual(value);
    }));

    it('should handle special characters in keys', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;
      const specialKey = 'key:with:colons:and-dashes_and_underscores.and.dots';

      service.set(specialKey, value, ttl);
      expect(service.get(specialKey)).toEqual(value);
    });

    it('should handle rapid get/set operations', () => {
      const ttl = 5 * 60 * 1000;

      for (let i = 0; i < 100; i++) {
        service.set(`key-${i}`, { value: i }, ttl);
      }

      for (let i = 0; i < 100; i++) {
        const result = service.get(`key-${i}`);
        expect(result).toEqual({ value: i });
      }
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete workflow', fakeAsync(() => {
      const ttl = 5 * 60 * 1000;

      // Set multiple entries
      service.set('user-1', { id: 1, name: 'User 1' }, ttl);
      service.set('user-2', { id: 2, name: 'User 2' }, ttl);
      service.set('user-3', { id: 3, name: 'User 3' }, ttl);

      // Verify entries exist
      expect(service.getEntryCount()).toBe(3);

      // Access some entries
      service.get('user-1');
      service.get('user-2');

      // Check stats
      let stats = service.getStats();
      expect(stats.totalHits).toBe(2);

      // Delete one entry
      service.delete('user-3');
      expect(service.getEntryCount()).toBe(2);

      // Wait for expiration
      tick(5 * 60 * 1000 + 100);

      // Trigger cleanup
      service.get('user-1');

      // Verify all expired
      expect(service.getEntryCount()).toBe(0);
    }));

    it('should handle cache replacement workflow', () => {
      const key = 'data-key';
      const ttl = 5 * 60 * 1000;

      // Set initial value
      service.set(key, { version: 1 }, ttl);
      expect(service.get(key)).toEqual({ version: 1 });

      // Replace with new value
      service.set(key, { version: 2 }, ttl);
      expect(service.get(key)).toEqual({ version: 2 });

      // Verify only one entry
      expect(service.getEntryCount()).toBe(1);
    });

    it('should handle mixed operations', fakeAsync(() => {
      const ttl = 5 * 60 * 1000;

      service.set('key-1', { data: 1 }, ttl);
      service.set('key-2', { data: 2 }, 1000); // Short TTL

      expect(service.has('key-1')).toBe(true);
      expect(service.has('key-2')).toBe(true);

      tick(1100);

      expect(service.has('key-1')).toBe(true);
      expect(service.has('key-2')).toBe(false);

      service.set('key-3', { data: 3 }, ttl);
      expect(service.getEntryCount()).toBe(2);

      service.clear();
      expect(service.getEntryCount()).toBe(0);
    }));
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should perform get operation in reasonable time', () => {
      const value = { data: 'test' };
      const ttl = 5 * 60 * 1000;

      service.set('perf-key', value, ttl);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        service.get('perf-key');
      }
      const end = performance.now();

      const avgTime = (end - start) / 1000;
      expect(avgTime).toBeLessThan(10); // Less than 10ms per operation
    });

    it('should perform set operation in reasonable time', () => {
      const ttl = 5 * 60 * 1000;

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        service.set(`perf-key-${i}`, { value: i }, ttl);
      }
      const end = performance.now();

      const avgTime = (end - start) / 100;
      expect(avgTime).toBeLessThan(10); // Less than 10ms per operation
    });
  });
});
