/**
 * Estructura de error estándar retornada por el backend.
 * Basada en RFC 7807 (Problem Details for HTTP APIs).
 *
 * Esta interfaz representa la estructura base de todos los errores
 * del API, proporcionando información consistente para debugging y UX.
 */
export interface ApiError {
  /**
   * Código de error de la aplicación (ej: "GC-0005")
   */
  codigoError: string;

  /**
   * Mensaje de error internacionalizado listo para mostrar al usuario
   */
  mensaje: string;

  /**
   * Código de estado HTTP (ej: 400, 404, 500)
   */
  codigoHttp: number;

  /**
   * URL de la petición que generó el error
   */
  url: string;

  /**
   * Método HTTP de la petición (GET, POST, PUT, DELETE)
   */
  metodo: string;
}

/**
 * Detalle de un error de validación específico de un parámetro de filtro.
 *
 * Permite identificar exactamente qué filtro y qué parámetro fallaron la validación,
 * facilitando la visualización de errores contextualizados en la UI.
 */
export interface ValidationErrorDetail {
  /**
   * Nombre del filtro al que pertenece el parámetro (ej: "RSI", "VOLUME")
   */
  filtro: string;

  /**
   * Nombre del parámetro que falló la validación (ej: "PERIODO_RSI", "CONDICION")
   */
  parametro: string;

  /**
   * Mensaje de error internacionalizado específico para este parámetro
   */
  mensaje: string;

  /**
   * Índice del filtro si hay múltiples filtros del mismo tipo.
   * Null si es el único filtro de ese tipo.
   */
  filtroIndex: number | null;
}

/**
 * Respuesta de error para errores de validación de filtros.
 * Extiende ApiError añadiendo una lista de errores de validación detallados.
 *
 * Esta estructura permite al frontend:
 * - Mostrar errores generales en un mensaje de error global
 * - Mostrar errores específicos junto al filtro/parámetro correspondiente
 * - Implementar validación en tiempo real basada en las reglas del backend
 */
export interface ValidationErrorResponse extends ApiError {
  /**
   * Lista de errores de validación detallados.
   * Cada elemento indica exactamente qué filtro y parámetro falló la validación.
   */
  erroresValidacion: ValidationErrorDetail[];
}

/**
 * Estructura de errores de validación de campos del scanner (nombre, descripción, etc.).
 * Formato: Record<nombreCampo, mensajeError>
 *
 * Ejemplo:
 * {
 *   "nombre": "El nombre es requerido",
 *   "descripcion": "La descripción debe tener al menos 10 caracteres"
 * }
 */
export type ScannerFieldErrors = Record<string, string>;

/**
 * Type guard para verificar si un error es de tipo ValidationErrorResponse
 */
export function isValidationErrorResponse(error: any): error is ValidationErrorResponse {
  return error &&
    typeof error === 'object' &&
    'erroresValidacion' in error &&
    Array.isArray(error.erroresValidacion);
}

/**
 * Type guard para verificar si un error es un error de campos de scanner
 */
export function isScannerFieldErrors(error: any): error is ScannerFieldErrors {
  return error &&
    typeof error === 'object' &&
    !('erroresValidacion' in error) &&
    !('codigoError' in error);
}
