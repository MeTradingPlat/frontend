import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { ScannerApiService } from './scanner-api.service';
import { ScannerStorageService } from './scanner-storage.service';
import { Escaner, EscanerDTOPeticion, EscanerDTORespuesta } from '../models/escaner.interface';
import { EstadoEscaner, EstadoEscanerDTORespuesta } from '../models/estado-escaner.interface';
import { Mercado, MercadoDTORespuesta } from '../models/mercado.interface';
import { ApiError } from '../../../core/models/api-error';
import { Filtro, FiltroDtoRespuesta, FiltroDtoPeticion } from '../models/filtro.interface';
import { Categoria, CategoriaDTORespuesta } from '../models/categoria.interface';
import { ValorDTORespuesta, ValorDTOPeticion } from '../models/valor.interface';
import { ValorTipado } from '../models/parametro.interface';
import { ValorInteger } from '../models/valor-integer.interface';
import { ValorFloat } from '../models/valor-float.interface';
import { ValorString } from '../models/valor-string.interface';
import { ValorCondicional } from '../models/valor-condicional.interface';


/**
 * Servicio Facade - Punto de entrada único para el feature Scanner
 * Maneja estado, lógica de negocio, y orquesta servicios
 */
@Injectable({
  providedIn: 'root'
})
export class ScannerFacadeService {
  private readonly apiService = inject(ScannerApiService);
  private readonly storageService = inject(ScannerStorageService);

  // Estado local usando signals
  public escaners = signal<Escaner[]>([]);
  public mercados = signal<Mercado[]>([]);
  public categoriasFiltros = signal<Categoria[]>([]);
  public filtrosEscaner = signal<Filtro[]>([]);
  public loading = signal<boolean>(false);
  public error = signal<ApiError | null>(null);
  public selectedScanner = signal<Escaner | null>(null);

  /**
   * Selecciona un escaner
   */
  selectEscaner(scanner: Escaner | null): void {
    this.selectedScanner.set(scanner);
  }

  /**
   * Obtiene todos los escaneres
   */
  loadEscaners(forceRefresh: boolean = false): Observable<Escaner[]> {
    // Si no es forzado y ya tenemos datos, devolver cache
    if (!forceRefresh && this.escaners().length > 0) {
      return of(this.escaners());
    }

    this.loading.set(true);
    this.error.set(null);

    return this.apiService.getEscaneres().pipe(
      map(dtos => this.mapDTOsToEscaners(dtos)),
      tap(escaners => {
        this.escaners.set(escaners);
        // Guardar en storage para uso offline (opcional)
        this.storageService.saveEscaners(escaners);
      }),
      catchError(error => {
        this.error.set(error);
        // Intentar cargar desde storage como fallback
        const cached = this.storageService.getEscaners();
        if (cached && cached.length > 0) {
          this.escaners.set(cached);
          return of(cached);
        }
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Obtiene todos los escaneres archivados
   */
  loadArchivedEscaners(forceRefresh: boolean = false): Observable<Escaner[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.getArchivedEscaneres().pipe(
      map(dtos => this.mapDTOsToEscaners(dtos)),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Obtiene un escaner por ID
   */
  getEscanerById(id: number): Observable<Escaner> {
    // Buscar primero en el estado local
    const escaner = this.escaners().find(e => e.idEscaner === id);
    if (escaner) {
      return of(escaner);
    }

    // Si no está en memoria, llamar a la API
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.getEscanerById(id).pipe(
      map(dto => this.mapDTOToEscaner(dto)),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Crea un nuevo escaner
   */
  createEscaner(escaner: Escaner): Observable<Escaner> {
    this.loading.set(true);
    this.error.set(null);

    const dto = this.mapEscanerToDTO(escaner);

    return this.apiService.createEscaner(dto).pipe(
      map(responseDto => this.mapDTOToEscaner(responseDto)),
      tap(newEscaner => {
        // Actualizar el estado local
        this.escaners.update(current => [...current, newEscaner]);
        // Actualizar storage
        this.storageService.saveEscaners(this.escaners());
      }),
      catchError(error => {
        // Solo establecer error global para errores de servidor (500, 503, etc.)
        // Los errores de validación (400, 406) deben manejarse en el componente
        if (error.status && error.status >= 500) {
          this.error.set(error);
        }
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Actualiza un escaner existente
   */
  updateEscaner(id: number, escaner: Escaner): Observable<Escaner> {
    this.loading.set(true);
    this.error.set(null);

    const dto = this.mapEscanerToDTO(escaner);

    return this.apiService.updateEscaner(id, dto).pipe(
      map(responseDto => this.mapDTOToEscaner(responseDto)),
      tap(updatedEscaner => {
        this.escaners.update(current =>
          current.map(e => e.idEscaner === id ? updatedEscaner : e)
        );
        this.storageService.saveEscaners(this.escaners());
      }),
      catchError(error => {
        // Solo establecer error global para errores de servidor (500, 503, etc.)
        // Los errores de validación (400, 406) deben manejarse en el componente
        if (error.status && error.status >= 500) {
          this.error.set(error);
        }
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Elimina un escaner
   */
  deleteEscaner(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.deleteEscaner(id).pipe(
      tap(() => {
        // Remover del estado local
        this.escaners.update(current => current.filter(e => e.idEscaner !== id));
        this.storageService.saveEscaners(this.escaners());
      }),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }
  /**
   * Inicia un escaner
   */
  iniciarEscaner(id: number): Observable<EstadoEscaner> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.iniciarEscaner(id).pipe(
      map(responseDto => this.mapDTOToEstadoEscaner(responseDto)),
      tap(nuevoEstado => {
        this.escaners.update(current =>
          current.map(e => e.idEscaner === id ? { ...e, objEstado: nuevoEstado } : e)
        );
        this.storageService.saveEscaners(this.escaners());
      }),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Detiene un escaner
   */
  detenerEscaner(id: number): Observable<EstadoEscaner> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.detenerEscaner(id).pipe(
      map(responseDto => this.mapDTOToEstadoEscaner(responseDto)),
      tap(nuevoEstado => {
        this.escaners.update(current =>
          current.map(e => e.idEscaner === id ? { ...e, objEstado: nuevoEstado } : e)
        );
        this.storageService.saveEscaners(this.escaners());
      }),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Archiva un escaner
   */
  archivarEscaner(id: number): Observable<EstadoEscaner> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.archivarEscaner(id).pipe(
      map(responseDto => this.mapDTOToEstadoEscaner(responseDto)),
      tap(nuevoEstado => {
        // Remover de la lista de escaners activos (se va a archivados)
        this.escaners.update(current =>
          current.filter(e => e.idEscaner !== id)
        );
        this.storageService.saveEscaners(this.escaners());
      }),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Desarchiva un escaner
   */
  desarchivarEscaner(id: number): Observable<EstadoEscaner> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.desarchivarEscaner(id).pipe(
      map(responseDto => this.mapDTOToEstadoEscaner(responseDto)),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Carga la lista de mercados disponibles
   */
  loadMercados(forceRefresh: boolean = false): Observable<Mercado[]> {
    // Si no es forzado y ya tenemos datos, devolver cache
    if (!forceRefresh && this.mercados().length > 0) {
      return of(this.mercados());
    }

    this.loading.set(true);
    this.error.set(null);

    return this.apiService.listMercados().pipe(
      map(dtos => dtos.map(dto => this.mapDTOTOMercado(dto))),
      tap(mercados => {
        this.mercados.set(mercados);
        this.storageService.saveMercados(mercados);
      }),
      catchError(error => {
        this.error.set(error);
        // Intentar cargar desde storage como fallback
        const cached = this.storageService.getMercados();
        if (cached && cached.length > 0) {
          this.mercados.set(cached);
          return of(cached);
        }
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Limpia el estado completo
   */
  clearState(): void {
    this.escaners.set([]);
    this.mercados.set([]);
    this.categoriasFiltros.set([]);
    this.filtrosEscaner.set([]);
    this.error.set(null);
    this.loading.set(false);
    this.selectedScanner.set(null);
  }

  // ===== MÉTODOS DE FILTROS =====

  /**
   * Obtiene todas las categorías de filtros disponibles
   */
  loadCategoriasFiltros(forceRefresh: boolean = false): Observable<Categoria[]> {
    if (!forceRefresh && this.categoriasFiltros().length > 0) {
      return of(this.categoriasFiltros());
    }

    this.loading.set(true);
    this.error.set(null);

    return this.apiService.getCategoriasFiltros().pipe(
      map(dtos => dtos.map(dto => this.mapDTOToCategoria(dto))),
      tap(categorias => this.categoriasFiltros.set(categorias)),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Obtiene los filtros por categoría
   */
  getFiltrosPorCategoria(categoria: string): Observable<Filtro[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.getFiltrosPorCategoria(categoria).pipe(
      map(dtos => dtos.map(dto => this.mapDTOToFiltro(dto))),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Obtiene el filtro por defecto SIN modificar el estado global de loading
   * Útil para operaciones que no deben afectar la UI global
   */
  getFiltroPorDefectoSilent(enumFiltro: string): Observable<Filtro> {
    return this.apiService.getFiltroPorDefecto(enumFiltro).pipe(
      map(dto => this.mapDTOToFiltro(dto))
    );
  }

  /**
   * Obtiene el filtro por defecto
   */
  getFiltroPorDefecto(enumFiltro: string): Observable<Filtro> {
    this.loading.set(true);
    this.error.set(null);

    return this.apiService.getFiltroPorDefecto(enumFiltro).pipe(
      map(dto => this.mapDTOToFiltro(dto)),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Obtiene los filtros de un escaner específico
   */
  loadFiltrosEscaner(idEscaner: number, forceRefresh: boolean = false): Observable<Filtro[]> {
    if (!forceRefresh && this.filtrosEscaner().length > 0) {
      return of(this.filtrosEscaner());
    }

    this.loading.set(true);
    this.error.set(null);

    return this.apiService.getFiltrosEscaner(idEscaner).pipe(
      map(dtos => dtos.map(dto => this.mapDTOToFiltro(dto))),
      tap(filtros => this.filtrosEscaner.set(filtros)),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Obtiene los filtros de un escaner específico SIN modificar el estado global de loading/error
   * Útil para tabs que no deben afectar el estado global de la aplicación
   */
  loadFiltrosEscanerSilent(idEscaner: number): Observable<Filtro[]> {
    return this.apiService.getFiltrosEscaner(idEscaner).pipe(
      map(dtos => dtos.map(dto => this.mapDTOToFiltro(dto)))
    );
  }

  /**
   * Guarda los filtros de un escaner SIN modificar el estado global de loading/error
   * Útil cuando se quiere manejar los errores de validación en el componente
   */
  guardarFiltrosEscanerSilent(idEscaner: number, filtros: Filtro[]): Observable<Filtro[]> {
    const dtos = filtros.map(filtro => this.mapFiltroToDTO(filtro));

    return this.apiService.guardarFiltrosEscaner(idEscaner, dtos).pipe(
      map(responseDtos => responseDtos.map(dto => this.mapDTOToFiltro(dto))),
      tap(filtrosGuardados => this.filtrosEscaner.set(filtrosGuardados))
    );
  }

  /**
   * Guarda los filtros de un escaner
   */
  guardarFiltrosEscaner(idEscaner: number, filtros: Filtro[]): Observable<Filtro[]> {
    this.loading.set(true);
    this.error.set(null);

    const dtos = filtros.map(filtro => this.mapFiltroToDTO(filtro));
    
    return this.apiService.guardarFiltrosEscaner(idEscaner, dtos).pipe(
      map(responseDtos => responseDtos.map(dto => this.mapDTOToFiltro(dto))),
      tap(filtrosGuardados => this.filtrosEscaner.set(filtrosGuardados)),
      catchError(error => {
        this.error.set(error);
        return throwError(() => error);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  // ===== MAPPERS =====

  /**
   * Convierte un DTO de respuesta a modelo de dominio
   */
  private mapDTOToEscaner(dto: EscanerDTORespuesta): Escaner {
    if (!dto) {
      throw new Error('DTO de escaner es undefined o null');
    }

    return {
      idEscaner: dto.idEscaner,
      nombre: dto.nombre || '',
      descripcion: dto.descripcion || '',
      horaInicio: dto.horaInicio || '',
      horaFin: dto.horaFin || '',
      fechaCreacion: dto.fechaCreacion,
      mercados: (dto.mercados || []).map(m => ({
        etiqueta: m?.etiqueta || '',
        enumMercado: m?.enumMercado || ''
      })),
      objEstado: dto.objEstado ? {
        enumEstadoEscaner: dto.objEstado.enumEstadoEscaner,
        fechaRegistro: dto.objEstado.fechaRegistro
      } : undefined,
      objTipoEjecucion: {
        etiqueta: dto.objTipoEjecucion?.etiqueta || '',
        enumTipoEjecucion: dto.objTipoEjecucion?.enumTipoEjecucion || ''
      }
    };
  }

  /**
   * Convierte múltiples DTOs a modelos de dominio
   */
  private mapDTOsToEscaners(dtos: EscanerDTORespuesta[]): Escaner[] {
    return dtos.map(dto => this.mapDTOToEscaner(dto));
  }

  /**
   * Convierte modelo de dominio a DTO de petición
   */
  private mapEscanerToDTO(escaner: Escaner): EscanerDTOPeticion {
    if (!escaner) {
      throw new Error('Escaner es undefined o null');
    }

    return {
      nombre: escaner.nombre,
      descripcion: escaner.descripcion,
      horaInicio: escaner.horaInicio,
      horaFin: escaner.horaFin,
      mercados: (escaner.mercados || []).map(m => ({
        enumMercado: m?.enumMercado || ''
      })),
      objTipoEjecucion: {
        enumTipoEjecucion: escaner.objTipoEjecucion?.enumTipoEjecucion || ''
      }
    };
  }

  private mapDTOTOMercado(dto: MercadoDTORespuesta): Mercado {
    return {
      etiqueta: dto.etiqueta,
      enumMercado: dto.enumMercado
    };
  }

  /**
   * Convierte un DTO de categoría a modelo de dominio
   */
  private mapDTOToCategoria(dto: CategoriaDTORespuesta): Categoria {
    return {
      enumCategoriaFiltro: dto.enumCategoriaFiltro,
      etiqueta: dto.etiqueta
    };
  }

  /**
   * Convierte un DTO de filtro de respuesta a modelo de dominio
   */
  private mapDTOToFiltro(dto: FiltroDtoRespuesta): Filtro {
    return {
      enumFiltro: dto.enumFiltro,
      etiquetaNombre: dto.etiquetaNombre,
      etiquetaDescripcion: dto.etiquetaDescripcion,
      objCategoria: dto.objCategoria ? {
        enumCategoriaFiltro: dto.objCategoria.enumCategoriaFiltro,
        etiqueta: dto.objCategoria.etiqueta
      } : undefined,
      parametros: (dto.parametros || []).map(param => ({
        enumParametro: param.enumParametro,
        etiqueta: param.etiqueta,
        objValorSeleccionado: this.mapDTOToValorTipado(param.objValorSeleccionado),
        opciones: (param.opciones || []).map(opcion => this.mapDTOToValorTipado(opcion))
      }))
    };
  }

  /**
   * Convierte modelo de dominio de filtro a DTO de petición
   */
  private mapFiltroToDTO(filtro: Filtro): FiltroDtoPeticion {
    return {
      enumFiltro: filtro.enumFiltro,
      parametros: (filtro.parametros || []).map(param => ({
        enumParametro: param.enumParametro,
        objValorSeleccionado: this.mapValorTipadoToDTO(param.objValorSeleccionado)
      }))
    };
  }

  /**
   * Convierte un DTO de valor a su tipo específico según enumTipoValor
   */
  private mapDTOToValorTipado(dto: ValorDTORespuesta): ValorTipado {
    const baseValor = {
      etiqueta: dto.etiqueta,
      enumTipoValor: dto.enumTipoValor
    };

    // Cast del DTO para acceder a propiedades específicas
    const dtoAny = dto as any;

    switch (dto.enumTipoValor) {
      case 'INTEGER':
        return {
          ...baseValor,
          enumTipoValor: 'INTEGER',
          valor: typeof dtoAny.valor === 'number' ? dtoAny.valor : 0
        } as ValorInteger;

      case 'FLOAT':
        return {
          ...baseValor,
          enumTipoValor: 'FLOAT',
          valor: typeof dtoAny.valor === 'number' ? dtoAny.valor : 0.0
        } as ValorFloat;

      case 'STRING':
        return {
          ...baseValor,
          enumTipoValor: 'STRING',
          valor: typeof dtoAny.valor === 'string' ? dtoAny.valor : ''
        } as ValorString;

      case 'CONDICIONAL':
        return {
          ...baseValor,
          enumTipoValor: 'CONDICIONAL',
          enumCondicional: dtoAny.enumCondicional || '',
          isInteger: typeof dtoAny.isInteger === 'boolean' ? dtoAny.isInteger : false,
          valor1: typeof dtoAny.valor1 === 'number' ? dtoAny.valor1 : 0,
          valor2: typeof dtoAny.valor2 === 'number' ? dtoAny.valor2 : undefined
        } as ValorCondicional;

      default:
        console.warn(`Tipo de valor no reconocido: ${dto.enumTipoValor}`);
        return {
          ...baseValor,
          enumTipoValor: 'STRING',
          valor: ''
        } as ValorString;
    }
  }

  /**
   * Convierte un valor tipado a DTO de petición
   */
  private mapValorTipadoToDTO(valor: ValorTipado): ValorDTOPeticion {
    const baseDTO: ValorDTOPeticion = {
      enumTipoValor: valor.enumTipoValor
    };

    // Cast para acceder a propiedades específicas
    const dtoAny = baseDTO as any;

    switch (valor.enumTipoValor) {
      case 'INTEGER':
        dtoAny.valor = (valor as ValorInteger).valor;
        break;

      case 'FLOAT':
        dtoAny.valor = (valor as ValorFloat).valor;
        break;

      case 'STRING':
        dtoAny.valor = (valor as ValorString).valor;
        break;

      case 'CONDICIONAL':
        const valorCond = valor as ValorCondicional;
        dtoAny.enumCondicional = valorCond.enumCondicional;

        // Asegurar que los valores se envíen en el formato correcto según isInteger
        if (valorCond.isInteger) {
          dtoAny.valor1 = Math.round(valorCond.valor1);
          if (valorCond.valor2 !== undefined) {
            dtoAny.valor2 = Math.round(valorCond.valor2);
          }
        } else {
          // Para floats, enviar el valor tal cual
          dtoAny.valor1 = valorCond.valor1;
          if (valorCond.valor2 !== undefined) {
            dtoAny.valor2 = valorCond.valor2;
          }
        }
        break;
    }

    return baseDTO;
  }

  /**
   * Convierte un DTO de estado de escaner a modelo de dominio
   */
  private mapDTOToEstadoEscaner(dto: EstadoEscanerDTORespuesta): EstadoEscaner {
    return {
      enumEstadoEscaner: dto.enumEstadoEscaner,
      fechaRegistro: dto.fechaRegistro
    };
  }
}
