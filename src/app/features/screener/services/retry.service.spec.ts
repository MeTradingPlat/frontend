import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { RetryService, RetryConfig } from './retry.service';

/**
 * Unit Tests for RetryService
 * 
 * Tests cover:
 * - Retry logic with successful recovery
 * - Max retries exceeded
 * - Exponential backoff calculation
 * - Error classification
 * - Non-retryable errors
 * - Timeout handling
 * - Edge cases
 * 
 * Target Coverage: 85%
 */
describe('RetryService', () => {
  let service: RetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RetryService]
    });
    service = TestBed.inject(RetryService);
  });

  // ============================================================================
  // Service Creation Tests
  // ============================================================================

  describe('Service Creation', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should have default configuration', () => {
      const delay0 = service.calculateDelay(0);
      const delay1 = service.calculateDelay(1);
      const delay2 = service.calculateDelay(2);

      expect(delay0).toBe(1000); // 1 second
      expect(delay1).toBe(2000); // 2 seconds
      expect(delay2).toBe(4000); // 4 seconds
    });
  });

  // ============================================================================
  // Exponential Backoff Calculation Tests
  // ============================================================================

  describe('calculateDelay - Exponential Backoff', () => {
    it('should calculate correct delay for attempt 0', () => {
      const delay = service.calculateDelay(0);
      expect(delay).toBe(1000); // initialDelayMs * (2 ^ 0) = 1000 * 1 = 1000
    });

    it('should calculate correct delay for attempt 1', () => {
      const delay = service.calculateDelay(1);
      expect(delay).toBe(2000); // initialDelayMs * (2 ^ 1) = 1000 * 2 = 2000
    });

    it('should calculate correct delay for attempt 2', () => {
      const delay = service.calculateDelay(2);
      expect(delay).toBe(4000); // initialDelayMs * (2 ^ 2) = 1000 * 4 = 4000
    });

    it('should calculate correct delay for attempt 3', () => {
      const delay = service.calculateDelay(3);
      expect(delay).toBe(8000); // initialDelayMs * (2 ^ 3) = 1000 * 8 = 8000
    });

    it('should cap delay at maxDelayMs', () => {
      const delay = service.calculateDelay(4);
      // initialDelayMs * (2 ^ 4) = 1000 * 16 = 16000, but capped at 10000
      expect(delay).toBe(10000);
    });

    it('should cap delay at maxDelayMs for higher attempts', () => {
      const delay5 = service.calculateDelay(5);
      const delay10 = service.calculateDelay(10);

      expect(delay5).toBe(10000);
      expect(delay10).toBe(10000);
    });

    it('should handle negative attempt number', () => {
      const delay = service.calculateDelay(-1);
      expect(delay).toBe(0);
    });

    it('should handle custom configuration', () => {
      const customConfig: Partial<RetryConfig> = {
        initialDelayMs: 500,
        backoffMultiplier: 3,
        maxDelayMs: 5000
      };

      const delay0 = service.calculateDelay(0, customConfig);
      const delay1 = service.calculateDelay(1, customConfig);
      const delay2 = service.calculateDelay(2, customConfig);

      expect(delay0).toBe(500); // 500 * (3 ^ 0) = 500
      expect(delay1).toBe(1500); // 500 * (3 ^ 1) = 1500
      expect(delay2).toBe(4500); // 500 * (3 ^ 2) = 4500
    });

    it('should handle custom maxDelayMs', () => {
      const customConfig: Partial<RetryConfig> = {
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 3000
      };

      const delay0 = service.calculateDelay(0, customConfig);
      const delay1 = service.calculateDelay(1, customConfig);
      const delay2 = service.calculateDelay(2, customConfig);
      const delay3 = service.calculateDelay(3, customConfig);

      expect(delay0).toBe(1000);
      expect(delay1).toBe(2000);
      expect(delay2).toBe(3000); // Capped at 3000
      expect(delay3).toBe(3000); // Capped at 3000
    });

    it('should handle negative initialDelayMs', () => {
      const customConfig: Partial<RetryConfig> = {
        initialDelayMs: -1000
      };

      const delay = service.calculateDelay(0, customConfig);
      expect(delay).toBe(0);
    });

    it('should round delay to nearest integer', () => {
      const customConfig: Partial<RetryConfig> = {
        initialDelayMs: 333,
        backoffMultiplier: 2
      };

      const delay0 = service.calculateDelay(0, customConfig);
      const delay1 = service.calculateDelay(1, customConfig);

      expect(delay0).toBe(333);
      expect(delay1).toBe(666);
      expect(Number.isInteger(delay0)).toBe(true);
      expect(Number.isInteger(delay1)).toBe(true);
    });
  });

  // ============================================================================
  // Error Classification Tests
  // ============================================================================

  describe('isRetryable - Error Classification', () => {
    it('should retry on 500 Internal Server Error', () => {
      const error = new HttpErrorResponse({ status: 500 });
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should retry on 502 Bad Gateway', () => {
      const error = new HttpErrorResponse({ status: 502 });
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should retry on 503 Service Unavailable', () => {
      const error = new HttpErrorResponse({ status: 503 });
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should retry on 504 Gateway Timeout', () => {
      const error = new HttpErrorResponse({ status: 504 });
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should retry on 408 Request Timeout', () => {
      const error = new HttpErrorResponse({ status: 408 });
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should retry on 429 Too Many Requests', () => {
      const error = new HttpErrorResponse({ status: 429 });
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should not retry on 400 Bad Request', () => {
      const error = new HttpErrorResponse({ status: 400 });
      expect(service.isRetryable(error)).toBe(false);
    });

    it('should not retry on 401 Unauthorized', () => {
      const error = new HttpErrorResponse({ status: 401 });
      expect(service.isRetryable(error)).toBe(false);
    });

    it('should not retry on 403 Forbidden', () => {
      const error = new HttpErrorResponse({ status: 403 });
      expect(service.isRetryable(error)).toBe(false);
    });

    it('should not retry on 404 Not Found', () => {
      const error = new HttpErrorResponse({ status: 404 });
      expect(service.isRetryable(error)).toBe(false);
    });

    it('should retry on timeout error', () => {
      const error = new Error('timeout');
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should retry on network error', () => {
      const error = new HttpErrorResponse({ status: 0 });
      expect(service.isRetryable(error)).toBe(true);
    });

    it('should respect custom retryableStatusCodes', () => {
      const customConfig: Partial<RetryConfig> = {
        retryableStatusCodes: [500, 502]
      };

      const error503 = new HttpErrorResponse({ status: 503 });
      const error500 = new HttpErrorResponse({ status: 500 });

      expect(service.isRetryable(error503, customConfig)).toBe(false);
      expect(service.isRetryable(error500, customConfig)).toBe(true);
    });
  });

  // ============================================================================
  // Retry Logic Tests
  // ============================================================================

  describe('retry - Retry Logic', () => {
    it('should succeed on first attempt', fakeAsync(() => {
      const expectedData = { id: 1, name: 'Test' };
      let result: any;
      let error: any;

      service
        .retry(() => of(expectedData))
        .subscribe(
          data => (result = data),
          err => (error = err)
        );

      tick();

      expect(result).toEqual(expectedData);
      expect(error).toBeUndefined();
    }));

    it('should retry on 5xx error and succeed', fakeAsync(() => {
      let attemptCount = 0;
      const expectedData = { id: 1, name: 'Test' };
      let result: any;
      let error: any;

      const operation = () => {
        attemptCount++;
        if (attemptCount === 1) {
          return throwError(() => new HttpErrorResponse({ status: 503 }));
        }
        return of(expectedData);
      };

      service.retry(operation).subscribe(
        data => (result = data),
        err => (error = err)
      );

      tick(1000); // Wait for first retry delay

      expect(result).toEqual(expectedData);
      expect(error).toBeUndefined();
      expect(attemptCount).toBe(2);
    }));

    it('should retry multiple times with exponential backoff', fakeAsync(() => {
      let attemptCount = 0;
      const expectedData = { id: 1, name: 'Test' };
      let result: any;
      let error: any;

      const operation = () => {
        attemptCount++;
        if (attemptCount < 3) {
          return throwError(() => new HttpErrorResponse({ status: 503 }));
        }
        return of(expectedData);
      };

      service.retry(operation).subscribe(
        data => (result = data),
        err => (error = err)
      );

      // First retry after 1 second
      tick(1000);
      expect(attemptCount).toBe(2);

      // Second retry after 2 seconds
      tick(2000);
      expect(attemptCount).toBe(3);

      tick();

      expect(result).toEqual(expectedData);
      expect(error).toBeUndefined();
    }));

    it('should fail after max retries exceeded', fakeAsync(() => {
      let attemptCount = 0;
      let result: any;
      let error: any;

      const operation = () => {
        attemptCount++;
        return throwError(() => new HttpErrorResponse({ status: 503 }));
      };

      service.retry(operation).subscribe(
        data => (result = data),
        err => (error = err)
      );

      // Initial attempt
      tick();
      expect(attemptCount).toBe(1);

      // First retry after 1 second
      tick(1000);
      expect(attemptCount).toBe(2);

      // Second retry after 2 seconds
      tick(2000);
      expect(attemptCount).toBe(3);

      tick();

      expect(result).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.status).toBe(503);
    }));

    it('should not retry on 4xx client error', fakeAsync(() => {
      let attemptCount = 0;
      let result: any;
      let error: any;

      const operation = () => {
        attemptCount++;
        return throwError(() => new HttpErrorResponse({ status: 404 }));
      };

      service.retry(operation).subscribe(
        data => (result = data),
        err => (error = err)
      );

      tick();

      expect(result).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.status).toBe(404);
      expect(attemptCount).toBe(1); // No retries
    }));

    it('should use custom retry configuration', fakeAsync(() => {
      let attemptCount = 0;
      const expectedData = { id: 1, name: 'Test' };
      let result: any;
      let error: any;

      const customConfig: Partial<RetryConfig> = {
        maxRetries: 1,
        initialDelayMs: 500
      };

      const operation = () => {
        attemptCount++;
        if (attemptCount === 1) {
          return throwError(() => new HttpErrorResponse({ status: 503 }));
        }
        return of(expectedData);
      };

      service.retry(operation, customConfig).subscribe(
        data => (result = data),
        err => (error = err)
      );

      tick(500); // Wait for custom delay

      expect(result).toEqual(expectedData);
      expect(error).toBeUndefined();
      expect(attemptCount).toBe(2);
    }));

    it('should handle timeout errors', fakeAsync(() => {
      let attemptCount = 0;
      const expectedData = { id: 1, name: 'Test' };
      let result: any;
      let error: any;

      const operation = () => {
        attemptCount++;
        if (attemptCount === 1) {
          return throwError(() => new Error('timeout'));
        }
        return of(expectedData);
      };

      service.retry(operation).subscribe(
        data => (result = data),
        err => (error = err)
      );

      tick(1000); // Wait for retry delay

      expect(result).toEqual(expectedData);
      expect(error).toBeUndefined();
      expect(attemptCount).toBe(2);
    }));

    it('should handle network errors', fakeAsync(() => {
      let attemptCount = 0;
      const expectedData = { id: 1, name: 'Test' };
      let result: any;
      let error: any;

      const operation = () => {
        attemptCount++;
        if (attemptCount === 1) {
          return throwError(() => new HttpErrorResponse({ status: 0 }));
        }
        return of(expectedData);
      };

      service.retry(operation).subscribe(
        data => (result = data),
        err => (error = err)
      );

      tick(1000); // Wait for retry delay

      expect(result).toEqual(expectedData);
      expect(error).toBeUndefined();
      expect(attemptCount).toBe(2);
    }));

    it('should propagate final error with correct status code', fakeAsync(() => {
      let error: any;

      const operation = () => {
        return throwError(() => new HttpErrorResponse({ status: 503 }));
      };

      service.retry(operation).subscribe(
        () => {},
        err => (error = err)
      );

      tick(1000); // First retry
      tick(2000); // Second retry
      tick();

      expect(error).toBeDefined();
      expect(error.status).toBe(503);
    }));
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero retries configuration', fakeAsync(() => {
      let attemptCount = 0;
      let error: any;

      const customConfig: Partial<RetryConfig> = {
        maxRetries: 0
      };

      const operation = () => {
        attemptCount++;
        return throwError(() => new HttpErrorResponse({ status: 503 }));
      };

      service.retry(operation, customConfig).subscribe(
        () => {},
        err => (error = err)
      );

      tick();

      expect(attemptCount).toBe(1); // Only initial attempt, no retries
      expect(error).toBeDefined();
    }));

    it('should handle very large backoff multiplier', () => {
      const customConfig: Partial<RetryConfig> = {
        initialDelayMs: 1000,
        backoffMultiplier: 10,
        maxDelayMs: 10000
      };

      const delay0 = service.calculateDelay(0, customConfig);
      const delay1 = service.calculateDelay(1, customConfig);

      expect(delay0).toBe(1000);
      expect(delay1).toBe(10000); // Capped at maxDelayMs
    });

    it('should handle backoff multiplier of 1', () => {
      const customConfig: Partial<RetryConfig> = {
        initialDelayMs: 1000,
        backoffMultiplier: 1,
        maxDelayMs: 10000
      };

      const delay0 = service.calculateDelay(0, customConfig);
      const delay1 = service.calculateDelay(1, customConfig);
      const delay2 = service.calculateDelay(2, customConfig);

      expect(delay0).toBe(1000);
      expect(delay1).toBe(1000); // No exponential growth
      expect(delay2).toBe(1000);
    });

    it('should handle empty retryableStatusCodes array', () => {
      const customConfig: Partial<RetryConfig> = {
        retryableStatusCodes: []
      };

      const error = new HttpErrorResponse({ status: 503 });
      expect(service.isRetryable(error, customConfig)).toBe(false);
    });

    it('should handle non-HttpErrorResponse errors', () => {
      const error = new Error('Generic error');
      expect(service.isRetryable(error)).toBe(false);
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should calculate delay in less than 5ms', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        service.calculateDelay(i);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 1000;

      expect(averageTime).toBeLessThan(5);
    });

    it('should classify error in less than 5ms', () => {
      const error = new HttpErrorResponse({ status: 503 });
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        service.isRetryable(error);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / 1000;

      expect(averageTime).toBeLessThan(5);
    });
  });
});
