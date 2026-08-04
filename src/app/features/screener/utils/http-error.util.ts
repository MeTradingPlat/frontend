/**
 * HTTP Error Classification and Handling Utilities
 * 
 * This utility module provides functions for classifying HTTP errors,
 * determining retry strategies, and generating user-friendly error messages.
 */

import { HttpErrorResponse } from '@angular/common/http';

/**
 * Enumeration of HTTP error types
 */
export enum HttpErrorType {
  CLIENT_ERROR = 'CLIENT_ERROR',      // 4xx errors
  SERVER_ERROR = 'SERVER_ERROR',      // 5xx errors
  TIMEOUT = 'TIMEOUT',                // Request timeout
  NETWORK_ERROR = 'NETWORK_ERROR',    // Network connectivity issues
  UNKNOWN = 'UNKNOWN'                 // Unknown error type
}

/**
 * Enumeration of error severity levels
 */
export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Classified HTTP error information
 * 
 * @interface ClassifiedError
 * @property {HttpErrorType} type - Type of error
 * @property {ErrorSeverity} severity - Severity level
 * @property {number} [statusCode] - HTTP status code if available
 * @property {string} message - Error message
 * @property {boolean} isRetryable - Whether the error is retryable
 * @property {string} userMessage - User-friendly error message
 */
export interface ClassifiedError {
  type: HttpErrorType;
  severity: ErrorSeverity;
  statusCode?: number;
  message: string;
  isRetryable: boolean;
  userMessage: string;
}

/**
 * Classifies an HTTP error into a specific type
 * 
 * Determines the error type based on status code, error object properties,
 * and other indicators. Returns a ClassifiedError object with detailed
 * information about the error.
 * 
 * @param {any} error - The error object to classify
 * @returns {ClassifiedError} Classified error information
 * 
 * @example
 * try {
 *   // HTTP request
 * } catch (error) {
 *   const classified = classifyHttpError(error);
 *   console.log(classified.type); // HttpErrorType.SERVER_ERROR
 *   console.log(classified.userMessage); // "Service temporarily unavailable"
 * }
 */
export function classifyHttpError(error: any): ClassifiedError {
  // Handle HttpErrorResponse from Angular
  if (error instanceof HttpErrorResponse) {
    return classifyHttpErrorResponse(error);
  }

  // Handle timeout errors
  if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
    return {
      type: HttpErrorType.TIMEOUT,
      severity: ErrorSeverity.WARNING,
      message: 'Request timeout',
      isRetryable: true,
      userMessage: 'Request timed out. Please try again.'
    };
  }

  // Handle network errors
  if (error?.status === 0 || error?.message?.includes('network')) {
    return {
      type: HttpErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.ERROR,
      message: 'Network error',
      isRetryable: true,
      userMessage: 'Network connection error. Please check your internet connection.'
    };
  }

  // Unknown error
  return {
    type: HttpErrorType.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    message: error?.message || 'Unknown error',
    isRetryable: false,
    userMessage: 'An unexpected error occurred. Please try again later.'
  };
}

/**
 * Classifies an HttpErrorResponse from Angular
 * 
 * @private
 * @param {HttpErrorResponse} error - The HTTP error response
 * @returns {ClassifiedError} Classified error information
 */
function classifyHttpErrorResponse(error: HttpErrorResponse): ClassifiedError {
  const statusCode = error.status;

  // 4xx Client Errors - Not retryable
  if (statusCode >= 400 && statusCode < 500) {
    return classifyClientError(statusCode, error);
  }

  // 5xx Server Errors - Retryable
  if (statusCode >= 500 && statusCode < 600) {
    return classifyServerError(statusCode, error);
  }

  // Timeout (0 status with timeout message)
  if (statusCode === 0 && error.message?.includes('timeout')) {
    return {
      type: HttpErrorType.TIMEOUT,
      severity: ErrorSeverity.WARNING,
      statusCode: 0,
      message: 'Request timeout',
      isRetryable: true,
      userMessage: 'Request timed out. Please try again.'
    };
  }

  // Network error (0 status)
  if (statusCode === 0) {
    return {
      type: HttpErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.ERROR,
      statusCode: 0,
      message: 'Network error',
      isRetryable: true,
      userMessage: 'Network connection error. Please check your internet connection.'
    };
  }

  // Unknown status code
  return {
    type: HttpErrorType.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    statusCode,
    message: error.message || 'Unknown error',
    isRetryable: false,
    userMessage: 'An unexpected error occurred. Please try again later.'
  };
}

/**
 * Classifies a 4xx client error
 * 
 * @private
 * @param {number} statusCode - HTTP status code
 * @param {HttpErrorResponse} error - The HTTP error response
 * @returns {ClassifiedError} Classified error information
 */
function classifyClientError(statusCode: number, error: HttpErrorResponse): ClassifiedError {
  let message = '';
  let userMessage = '';
  let severity = ErrorSeverity.ERROR;

  switch (statusCode) {
    case 400:
      message = 'Bad Request';
      userMessage = 'Invalid search parameters. Please check your input.';
      break;
    case 401:
      message = 'Unauthorized';
      userMessage = 'Your session has expired. Please log in again.';
      severity = ErrorSeverity.CRITICAL;
      break;
    case 403:
      message = 'Forbidden';
      userMessage = 'You do not have permission to access this resource.';
      break;
    case 404:
      message = 'Not Found';
      userMessage = 'Symbol not found. Please check the symbol and try again.';
      break;
    case 409:
      message = 'Conflict';
      userMessage = 'The requested resource conflicts with existing data.';
      break;
    case 429:
      message = 'Too Many Requests';
      userMessage = 'Too many requests. Please wait a moment and try again.';
      severity = ErrorSeverity.WARNING;
      break;
    default:
      message = `Client Error (${statusCode})`;
      userMessage = 'An error occurred with your request. Please try again.';
  }

  return {
    type: HttpErrorType.CLIENT_ERROR,
    severity,
    statusCode,
    message,
    isRetryable: false,
    userMessage
  };
}

/**
 * Classifies a 5xx server error
 * 
 * @private
 * @param {number} statusCode - HTTP status code
 * @param {HttpErrorResponse} error - The HTTP error response
 * @returns {ClassifiedError} Classified error information
 */
function classifyServerError(statusCode: number, error: HttpErrorResponse): ClassifiedError {
  let message = '';
  let userMessage = '';

  switch (statusCode) {
    case 500:
      message = 'Internal Server Error';
      userMessage = 'Server error. Please try again later.';
      break;
    case 502:
      message = 'Bad Gateway';
      userMessage = 'Service temporarily unavailable. Please try again.';
      break;
    case 503:
      message = 'Service Unavailable';
      userMessage = 'Service temporarily unavailable. Please try again.';
      break;
    case 504:
      message = 'Gateway Timeout';
      userMessage = 'Service is taking too long to respond. Please try again.';
      break;
    default:
      message = `Server Error (${statusCode})`;
      userMessage = 'Service error. Please try again later.';
  }

  return {
    type: HttpErrorType.SERVER_ERROR,
    severity: ErrorSeverity.ERROR,
    statusCode,
    message,
    isRetryable: true,
    userMessage
  };
}

/**
 * Determines if an error is retryable
 * 
 * An error is considered retryable if:
 * - It's a 5xx server error
 * - It's a timeout error
 * - It's a network error
 * - It's a 429 (Too Many Requests) error
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if the error is retryable, false otherwise
 * 
 * @example
 * if (isErrorRetryable(error)) {
 *   // Retry the request
 * }
 */
export function isErrorRetryable(error: any): boolean {
  const classified = classifyHttpError(error);
  return classified.isRetryable;
}

/**
 * Generates a user-friendly error message
 * 
 * Takes an error object and returns a message suitable for displaying
 * to end users. The message is clear, actionable, and avoids technical jargon.
 * 
 * @param {any} error - The error object
 * @returns {string} User-friendly error message
 * 
 * @example
 * try {
 *   // HTTP request
 * } catch (error) {
 *   const message = generateUserErrorMessage(error);
 *   showErrorToast(message); // "Symbol not found. Please check the symbol and try again."
 * }
 */
export function generateUserErrorMessage(error: any): string {
  const classified = classifyHttpError(error);
  return classified.userMessage;
}

/**
 * Determines if an error is a client error (4xx)
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if the error is a client error
 */
export function isClientError(error: any): boolean {
  const classified = classifyHttpError(error);
  return classified.type === HttpErrorType.CLIENT_ERROR;
}

/**
 * Determines if an error is a server error (5xx)
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if the error is a server error
 */
export function isServerError(error: any): boolean {
  const classified = classifyHttpError(error);
  return classified.type === HttpErrorType.SERVER_ERROR;
}

/**
 * Determines if an error is a timeout
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if the error is a timeout
 */
export function isTimeoutError(error: any): boolean {
  const classified = classifyHttpError(error);
  return classified.type === HttpErrorType.TIMEOUT;
}

/**
 * Determines if an error is a network error
 * 
 * @param {any} error - The error to check
 * @returns {boolean} True if the error is a network error
 */
export function isNetworkError(error: any): boolean {
  const classified = classifyHttpError(error);
  return classified.type === HttpErrorType.NETWORK_ERROR;
}

/**
 * Gets the HTTP status code from an error
 * 
 * @param {any} error - The error object
 * @returns {number | null} The HTTP status code, or null if not available
 */
export function getErrorStatusCode(error: any): number | null {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }
  const classified = classifyHttpError(error);
  return classified.statusCode || null;
}

/**
 * Gets the error severity level
 * 
 * @param {any} error - The error object
 * @returns {ErrorSeverity} The error severity level
 */
export function getErrorSeverity(error: any): ErrorSeverity {
  const classified = classifyHttpError(error);
  return classified.severity;
}
