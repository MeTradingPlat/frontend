import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, finalize, switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { NavMenuItem } from '../../models/navbar.model';
import { EscanerDTOPeticion, EscanerDTORespuesta } from '../../models/escaner.model';
import { EnumEstadoEscaner } from '../../enums/enum-estado-escaner';
import { EnumTipoEjecucion } from '../../enums/enum-tipo-ejecucion';
import { EnumMercado } from '../../enums/enum-mercado';
import { EnumConfigurationCard } from '../../enums/enum-configuration-card';
import { FiltroDtoPeticion } from '../../models/filtro-peticion.model'; // Import FiltroDtoPeticion
import { FiltroDtoRespuesta } from '../../models/filtro.model'; // Import FiltroDtoRespuesta
import { ParametroDTOPeticion } from '../../models/parametro-peticion.model';
import { ParametroDTORespuesta } from '../../models/parametro.model';
import { ValorDTOPeticion, ValorCondicionalDTOPeticion, ValorFloatDTOPeticion, ValorIntegerDTOPeticion, ValorStringDTOPeticion } from '../../models/valor.model';
import { ValorDTORespuesta, ValorCondicionalDTORespuesta, ValorFloatDTORespuesta, ValorIntegerDTORespuesta, ValorStringDTORespuesta } from '../../models/valor.model';


import { EscanerService } from '../../services/escaner.service';
import { EstadoEscanerService } from '../../services/estado-escaner.service';
import { FiltroService } from '../../services/filtro.service'; // Import FiltroService

import { NavbarAux } from '../../components/navbar/navbar-aux/navbar-aux';
import { LoadPage } from '../../components/page-state/load-page/load-page';
import { LoadPageError } from '../../components/page-state/load-page-error/load-page-error';
import { CardGeneral } from '../../components/scanner/configuration-card/card-general/card-general';
import { CardTime } from '../../components/scanner/configuration-card/card-time/card-time';
import { CardMarket } from '../../components/scanner/configuration-card/card-market/card-market';
import { CardFilter } from '../../components/scanner/configuration-card/card-filter/card-filter';

interface ApiError {
  codigoError: string;
  mensaje: string;
  codigoHttp: number;
  url: string;
  metodo: string;
}

@Component({
  selector: 'app-scanner-configuration',
  standalone: true,
  imports: [
    NavbarAux,
    LoadPage,
    LoadPageError,
    CardGeneral,
    CardTime,
    CardMarket,
    CardFilter
  ],
  templateUrl: './scanner-configuration.html',
  styleUrl: './scanner-configuration.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerConfiguration {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly escanerService = inject(EscanerService);
  private readonly estadoEscanerService = inject(EstadoEscanerService);
  private readonly filtroService = inject(FiltroService);

  // State signals
  scannerId = signal<number | null>(null);
  scannerEstado = signal<EnumEstadoEscaner | null>(null);
  currentScannerData = signal<EscanerDTOPeticion | undefined>(undefined);
  currentFilters = signal<FiltroDtoPeticion[]>([]); // New signal for filters
  submitted = signal<boolean>(false);
  generalFormValid = signal<boolean>(false);
  timeFormValid = signal<boolean>(false);
  marketFormValid = signal<boolean>(false);
  filtersFormValid = signal<boolean>(true); // Filters are valid by default if none are selected
  formTouched = signal<boolean>(false);
  loading = signal<boolean>(false);
  error = signal<ApiError | null>(null);
  loadError = signal<ApiError | null>(null);

  // Computed signals
  isNewScanner = computed(() => !this.scannerId() || this.scannerId() === 0);
  isFormValid = computed(() => this.generalFormValid() && this.timeFormValid() && this.marketFormValid() && this.filtersFormValid());

  backPath = '/escaner';
  protected readonly EnumConfigurationCard = EnumConfigurationCard;

  title = computed(() => {
    const isNew = this.isNewScanner();
    const scannerName = this.currentScannerData()?.nombre;
    return isNew ? $localize`Nuevo Escáner` : (scannerName ? scannerName : $localize`Editar Escáner`);
  });

  navItems = computed<NavMenuItem[]>(() => {
    const items: NavMenuItem[] = [];
    const isNewScanner = this.isNewScanner();
    const isFormValid = this.isFormValid();
    const currentScannerState = this.scannerEstado();
    const isLoading = this.loading();

    items.push({
      id: 1,
      path: '',
      iconClass: 'bi bi-save2-fill',
      buttonText: $localize`Guardar`,
      action: () => this.saveScannerConfiguration(this.backPath),
      disabled: !isFormValid || isLoading,
    });

    // Archivar button logic
    if (isNewScanner || (currentScannerState === EnumEstadoEscaner.DETENIDO || currentScannerState === EnumEstadoEscaner.DESARCHIVADO)) {
      items.push({
        id: 3,
        path: '',
        iconClass: 'bi bi-journal-arrow-down', // Updated icon
        buttonText: $localize`Archivar`,
        action: () => this.archiveScanner(this.backPath),
        disabled: isLoading,
      });
    }

    // Desarchivar button logic
    if (!isNewScanner && currentScannerState === EnumEstadoEscaner.ARCHIVADO) {
      items.push({
        id: 2,
        path: '',
        iconClass: 'bi bi-journal-arrow-up', // Updated icon
        buttonText: $localize`Desarchivar`,
        action: () => this.unarchiveScanner(this.backPath),
        disabled: isLoading,
      });
    }

    // Eliminar button logic (only for existing scanners)
    if (!isNewScanner) {
      items.push({
        id: 4,
        path: '',
        iconClass: 'bi bi-trash-fill',
        buttonText: $localize`Eliminar`,
        action: () => this.deleteScanner(this.backPath),
        disabled: isLoading,
      });
    }
    return items;
  });

  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = +(params.get('id') || 0);
        this.scannerId.set(id);
        this.loading.set(true);
        this.loadError.set(null);

        if (id && id !== 0) {
          return this.escanerService.getEscanerById(id).pipe(
            switchMap(scannerResponse => {
              this.scannerEstado.set(scannerResponse.objEstado.enumEstadoEscaner);
              const scannerData = this.mapResponseToPeticion(scannerResponse);

              return this.filtroService.getScannerFiltros(id).pipe(
                map(filtersResponse => {
                  const filtersPeticion: FiltroDtoPeticion[] = filtersResponse.map(filter => ({
                    enumFiltro: filter.enumFiltro,
                    parametros: filter.parametros.map(param => this.mapParametroRespuestaToPeticion(param))
                  }));
                  this.currentFilters.set(filtersPeticion);
                  return scannerData;
                }),
                catchError((err: HttpErrorResponse) => {
                  console.error('Error fetching filters:', err);
                  this.loadError.set(err.error as ApiError);
                  return of(scannerData); // Continue with scanner data even if filters fail
                })
              );
            }),
            catchError((err: HttpErrorResponse) => {
              this.loadError.set(err.error as ApiError);
              return of(null);
            }),
            finalize(() => this.loading.set(false))
          );
        } else {
          return of(this.getDefaultScannerData()).pipe(
            finalize(() => this.loading.set(false))
          );
        }
      })
    ).subscribe(data => {
      this.currentScannerData.set(data || undefined);
      this.generalFormValid.set(true);
      this.timeFormValid.set(true);
      this.marketFormValid.set(true);
      this.filtersFormValid.set(true); // Initialize filters form as valid
    });

    // Check for new filter from router state
    const newFilter = this.router.getCurrentNavigation()?.extras.state?.['newFilter'];
    if (newFilter) {
      this.currentFilters.update(filters => [...filters, newFilter]);
    }
  }

  onNavButtonClicked(item: NavMenuItem): void {
    if (item.action) {
      item.action();
    }
  }

  updateCardData(cardType: EnumConfigurationCard, data: Partial<EscanerDTOPeticion> | FiltroDtoPeticion[]): void {
    this.currentScannerData.update(currentData => {
      let updatedData = currentData ? { ...currentData } : this.getDefaultScannerData();

      switch (cardType) {
        case EnumConfigurationCard.GENERAL:
          const generalData = data as Partial<EscanerDTOPeticion>;
          updatedData = { ...updatedData, nombre: generalData.nombre || '', descripcion: generalData.descripcion || '' };
          break;
        case EnumConfigurationCard.TIME:
          const timeData = data as Partial<EscanerDTOPeticion>;
          updatedData = { ...updatedData, horaInicio: timeData.horaInicio || '', horaFin: timeData.horaFin || '', objTipoEjecucion: { enumTipoEjecucion: timeData.objTipoEjecucion?.enumTipoEjecucion as EnumTipoEjecucion } };
          break;
        case EnumConfigurationCard.MARKET:
          const marketData = data as Partial<EscanerDTOPeticion>;
          updatedData = { ...updatedData, mercados: marketData.mercados?.map(m => ({ enumMercado: m.enumMercado })) || [] };
          break;
        case EnumConfigurationCard.FILTERS:
          this.currentFilters.set(data as FiltroDtoPeticion[]);
          break;
      }
      this.formTouched.set(true);
      return updatedData;
    });
  }

  onFormValidityChange(cardType: EnumConfigurationCard, isValid: boolean): void {
    switch (cardType) {
      case EnumConfigurationCard.GENERAL:
        this.generalFormValid.set(isValid);
        break;
      case EnumConfigurationCard.TIME:
        this.timeFormValid.set(isValid);
        break;
      case EnumConfigurationCard.MARKET:
        this.marketFormValid.set(isValid);
        break;
      case EnumConfigurationCard.FILTERS:
        this.filtersFormValid.set(isValid);
        break;
    }
  }

  saveScannerConfiguration(backPath: string): void {
    this.submitted.set(true);
    this.error.set(null);
    const scannerData = this.currentScannerData();
    const filtersData = this.currentFilters();

    if (scannerData && this.isFormValid()) {
      this.loading.set(true);
      const scannerId = this.scannerId();

      const saveObservable = (scannerId && scannerId !== 0)
        ? this.escanerService.updateEscaner(scannerId, scannerData)
        : this.escanerService.createEscaner(scannerData);

      saveObservable.pipe(
        switchMap(response => {
          if (response && response.idEscaner) {
            const idToUse = response.idEscaner;
            if (filtersData.length > 0) {
              return this.filtroService.saveFiltros(idToUse, filtersData).pipe(
                map(() => response) // Return the original scanner response
              );
            }
            return of(response);
          }
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
        catchError((err: HttpErrorResponse) => {
          this.error.set(err.error as ApiError);
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          this.router.navigate([backPath]);
        }
      });
    } else {
      this.error.set({
        codigoError: 'FE-0001',
        mensaje: 'Formulario inválido. Por favor, revise los campos.',
        codigoHttp: 400,
        url: this.router.url,
        metodo: 'POST/PUT'
      });
    }
  }

  archiveScanner(backPath: string): void {
    this.error.set(null);
    this.loading.set(true);
    const scannerData = this.currentScannerData();
    const filtersData = this.currentFilters();

    if (!scannerData || !this.isFormValid()) {
      this.error.set({
        codigoError: 'FE-0001',
        mensaje: 'Formulario inválido. Por favor, revise los campos antes de archivar.',
        codigoHttp: 400,
        url: this.router.url,
        metodo: 'POST'
      });
      this.loading.set(false);
      return;
    }

    const scannerId = this.scannerId();

    let saveAndArchiveObservable;

    if (this.isNewScanner()) {
      saveAndArchiveObservable = this.escanerService.createEscaner(scannerData).pipe(
        switchMap(createResponse => {
          if (createResponse && createResponse.idEscaner) {
            this.scannerId.set(createResponse.idEscaner);
            const saveFiltersObservable = filtersData.length > 0
              ? this.filtroService.saveFiltros(createResponse.idEscaner, filtersData)
              : of([]); // If no filters, return an empty observable

            return saveFiltersObservable.pipe(
              switchMap(() => this.estadoEscanerService.archivarEscaner(createResponse.idEscaner))
            );
          } else {
            return of(null);
          }
        })
      );
    } else {
      saveAndArchiveObservable = this.escanerService.updateEscaner(scannerId!, scannerData).pipe(
        switchMap(updateResponse => {
          if (updateResponse) {
            const saveFiltersObservable = filtersData.length > 0
              ? this.filtroService.saveFiltros(scannerId!, filtersData)
              : of([]); // If no filters, return an empty observable

            return saveFiltersObservable.pipe(
              switchMap(() => this.estadoEscanerService.archivarEscaner(scannerId!))
            );
          } else {
            return of(null);
          }
        })
      );
    }

    saveAndArchiveObservable.pipe(
      finalize(() => this.loading.set(false)),
      catchError((err: HttpErrorResponse) => {
        this.error.set(err.error as ApiError);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.router.navigate([backPath]);
      }
    });
  }

  unarchiveScanner(backPath: string): void {
    this.error.set(null);
    const scannerId = this.scannerId();
    if (scannerId && scannerId !== 0) {
      this.loading.set(true);
      this.saveScannerConfiguration(backPath); // Save first
      this.estadoEscanerService.desarchivarEscaner(scannerId).pipe(
        finalize(() => this.loading.set(false)),
        catchError((err: HttpErrorResponse) => {
          this.error.set(err.error as ApiError);
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          this.router.navigate([backPath]);
        }
      });
    } else {
      this.error.set({
        codigoError: 'FE-0003',
        mensaje: 'No se encontró ID de escáner para desarchivar.',
        codigoHttp: 400,
        url: this.router.url,
        metodo: 'POST'
      });
    }
  }

  deleteScanner(backPath: string): void {
    this.error.set(null);
    const scannerId = this.scannerId();
    if (scannerId && scannerId !== 0) {
      this.loading.set(true);
      this.escanerService.deleteEscaner(scannerId).pipe(
        finalize(() => this.loading.set(false)),
        catchError((err: HttpErrorResponse) => {
          this.error.set(err.error as ApiError);
          return of(false);
        })
      ).subscribe(response => {
        if (response) {
          this.router.navigate([backPath]);
        }
      });
    } else {
      this.error.set({
        codigoError: 'FE-0004',
        mensaje: 'No se encontró ID de escáner para eliminar.',
        codigoHttp: 400,
        url: this.router.url,
        metodo: 'DELETE'
      });
    }
  }

  private mapResponseToPeticion(response: EscanerDTORespuesta): EscanerDTOPeticion {
    return {
      nombre: response.nombre,
      descripcion: response.descripcion,
      horaInicio: response.horaInicio,
      horaFin: response.horaFin,
      objTipoEjecucion: response.objTipoEjecucion || { enumTipoEjecucion: EnumTipoEjecucion.UNA_VEZ },
      mercados: response.mercados.map(m => ({ enumMercado: m.enumMercado }))
    };
  }

  private mapParametroRespuestaToPeticion(parametroRespuesta: ParametroDTORespuesta): ParametroDTOPeticion {
    let valorPeticion: ValorDTOPeticion;

    // Determine the specific type of ValorDTORespuesta and map it to the corresponding ValorDTOPeticion
    if ('enumCondicional' in parametroRespuesta.objValorSeleccionado) {
      const condicional = parametroRespuesta.objValorSeleccionado as ValorCondicionalDTORespuesta;
      valorPeticion = {
        enumTipoValor: condicional.enumTipoValor,
        enumCondicional: condicional.enumCondicional,
        valor1: condicional.valor1,
        valor2: condicional.valor2
      } as ValorCondicionalDTOPeticion;
    } else if ('valor' in parametroRespuesta.objValorSeleccionado) {
      switch (parametroRespuesta.objValorSeleccionado.enumTipoValor) {
        case 'INTEGER':
          valorPeticion = {
            enumTipoValor: parametroRespuesta.objValorSeleccionado.enumTipoValor,
            valor: (parametroRespuesta.objValorSeleccionado as ValorIntegerDTORespuesta).valor
          } as ValorIntegerDTOPeticion;
          break;
        case 'FLOAT':
          valorPeticion = {
            enumTipoValor: parametroRespuesta.objValorSeleccionado.enumTipoValor,
            valor: (parametroRespuesta.objValorSeleccionado as ValorFloatDTORespuesta).valor
          } as ValorFloatDTOPeticion;
          break;
        case 'STRING':
          valorPeticion = {
            enumTipoValor: parametroRespuesta.objValorSeleccionado.enumTipoValor,
            valor: (parametroRespuesta.objValorSeleccionado as ValorStringDTORespuesta).valor
          } as ValorStringDTOPeticion;
          break;
        default:
          valorPeticion = { enumTipoValor: parametroRespuesta.objValorSeleccionado.enumTipoValor };
          break;
      }
    } else {
      valorPeticion = { enumTipoValor: parametroRespuesta.objValorSeleccionado.enumTipoValor };
    }

    return {
      enumParametro: parametroRespuesta.enumParametro,
      objValorSeleccionado: valorPeticion
    };
  }

  private getDefaultScannerData(): EscanerDTOPeticion {
    return {
      nombre: '',
      descripcion: '',
      horaInicio: '09:30',
      horaFin: '16:00',
      objTipoEjecucion: { enumTipoEjecucion: EnumTipoEjecucion.UNA_VEZ },
      mercados: [{ enumMercado: EnumMercado.NYSE }]
    };
  }
}
