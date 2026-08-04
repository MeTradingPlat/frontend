import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { isErrorRetryable } from '../utils/http-error.util';

/**
 * RetryConfig Interface
 * 
 * Configuration for retry behavior with exponential backoff.
 * 
 * @interface RetryConfig
 * @property {number} maxRetries - Maximum number of retry attempts (default: 2)
 * @property {number} initialDelayMs - Initial delay in milliseconds (default: 1000)
 * @property {number} maxDelayMs - Maximum delay cap in milliseconds (default: 10000)
 * @property {number} backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @property {number[]} retryableStatusCodes - HTTP status codes to retry (default: [408, 429, 500, 502, 503, 504])
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Initial delay in milliseconds before first retry */
  initialDelayMs: number;

  /** Maximum delay cap in milliseconds */
  maxDelayMs: number;

  /** Multiplier for exponential backoff calculation */
  backoffMultiplier: number;

  /** HTTP status codes that should trigger a retry */
  retryableStatusCodes: number[];
}

/**
 * RetryService
 * 
 * Provides retry logic with exponential backoff for HTTP operations.
 * 
 * Features:
 * - Configurable retry policy
 * - Exponential backoff calculation
 * - Error classification and retry determination
 * - Support for custom retry configurations
 * 
 * Default Configuration:
 * - maxRetries: 2
 * - initialDelayMs: 1000 (1 second)
 * - maxDelayMs: 10000 (10 seconds)
 * - backoffMultiplier: 2
 * - retryableStatusCodes: [408, 429, 500, 502, 503, 504]
 * 
 * Exponential Backoff Formula:
 * delay = min(initialDelayMs * (backoffMultiplier ^ attempt), maxDelayMs)
 * 
 * Example delays with defaults:
 * - Attempt 1: 1000ms (1 second)
 * - Attempt 2: 2000ms (2 seconds)
 * - Attempt 3: 4000ms (4 seconds, capped at 10 seconds)
 * 
 * @example
 * ```typescript
 * constructor(private retryService: RetryService) {}
 * 
 * // Use default retry configuration
 * this.retryService.retry(() => this.http.get('/api/data'))
 *   .subscribe(
 *     data => console.log(data),
 *     error => console.error(error)
 *   );
 * 
 * // Use custom retry configuration
 * const customConfig: Partial<RetryConfig> = {
 *   maxRetries: 3,
 *   initialDelayMs: 500,
 *   maxDelayMs: 5000
 * };
 * 
 * this.retryService.retry(
 *   () => this.http.get('/api/data'),
 *   customConfig
 * ).subscribe(
 *   data => console.log(data),
 *   error => console.error(error)
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class RetryService {
  /**
   * Default retry configuration
   */
  private defaultConfig: RetryConfig = {
    maxRetries: 2,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  };

  constructor() {}

  /**
   * Retry an operation with exponential backoff
   * 
   * Executes the provided operation and automatically retries on retryable errors
   * with exponential backoff delays.
   * 
   * @template T - The type of the observable value
   * @param {() => Observable<T>} operation - Function that returns the observable to retry
   * @param {Partial<RetryConfig>} [config] - Optional custom retry configuration
   * @returns {Observable<T>} Observable that retries on failure
   * 
   * @example
   * ```typescript
   * this.retryService.retry(
   *   () => this.http.get<User>('/api/users/123')
   * ).subscribe(
   *   user => console.log(user),
   *   error => console.error('Failed after retries:', error)
   * );
   * ```
   */
  retry<T>(
    operation: () => Observable<T>,
    config?: Partial<RetryConfig>
  ): Observable<T> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    return operation().pipe(
      retry({
        count: mergedConfig.maxRetries,
        delay: (error, retryCount) => {
          // Check if error is retryable
          if (!this.isRetryable(error, mergedConfig)) {
            // Not retryable, throw immediately
            return throwError(() => error);
          }

          // Calculate delay for this retry attempt
          const delayMs = this.calculateDelay(retryCount, mergedConfig);

          // Return timer observable that will delay before retry
          return timer(delayMs);
        }
      }),
      catchError(error => {
        // Final error after all retries exhausted
        return throwError(() => error);
      })
    );
  }

  /**
   * Calculate delay for exponential backoff
   * 
   * Uses the formula: initialDelayMs * (backoffMultiplier ^ attempt)
   * The result is capped at maxDelayMs.
   * 
   * @param {number} attempt - The retry attempt number (0-indexed)
   * @param {RetryConfig} [config] - Optional retry configuration
   * @returns {number} Delay in milliseconds
   * 
   * @example
   * ```typescript
   * // With defaults: initialDelayMs=1000, backoffMultiplier=2, maxDelayMs=10000
   * this.calculateDelay(0); // Returns 1000 (1 second)
   * this.calculateDelay(1); // Returns 2000 (2 seconds)
   * this.calculateDelay(2); // Returns 4000 (4 seconds)
   * this.calculateDelay(3); // Returns 8000 (8 seconds)
   * this.calculateDelay(4); // Returns 10000 (capped at maxDelayMs)
   * ```
   */
  calculateDelay(attempt: number, config?: Partial<RetryConfig>): number {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Validate inputs
    if (attempt < 0) {
      return 0;
    }

    if (mergedConfig.initialDelayMs < 0) {
      return 0;
    }

    // Calculate exponential backoff: initialDelayMs * (backoffMultiplier ^ attempt)
    const exponentialDelay =
      mergedConfig.initialDelayMs *
      Math.pow(mergedConfig.backoffMultiplier, attempt);

    // Cap at maxDelayMs
    const cappedDelay = Math.min(exponentialDelay, mergedConfig.maxDelayMs);

    return Math.round(cappedDelay);
  }

  /**
   * Determine if an error is retryable
   * 
   * An error is retryable if:
   * - It's a 5xx server error
   * - It's a timeout error (408)
   * - It's a rate limit error (429)
   * - It's a network error
   * - Its status code is in the retryableStatusCodes list
   * 
   * Non-retryable errors:
   * - 4xx client errors (except 408 and 429)
   * - 401 Unauthorized
   * - 403 Forbidden
   * - 404 Not Found
   * 
   * @param {any} error - The error to check
   * @param {RetryConfig} [config] - Optional retry configuration
   * @returns {boolean} True if the error is retryable
   * 
   * @example
   * ```typescript
   * const error = new HttpErrorResponse({ status: 503 });
   * this.isRetryable(error); // Returns true
   * 
   * const error404 = new HttpErrorResponse({ status: 404 });
   * this.isRetryable(error404); // Returns false
   * ```
   */
  isRetryable(error: any, config?: Partial<RetryConfig>): boolean {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Use the utility function from http-error.util
    if (isErrorRetryable(error)) {
      // Additional check: verify status code is in retryable list if it's an HttpErrorResponse
      if (error instanceof HttpErrorResponse) {
        return mergedConfig.retryableStatusCodes.includes(error.status);
      }
      // For non-HTTP errors (timeout, network), they are retryable
      return true;
    }

    return false;
  }
}
