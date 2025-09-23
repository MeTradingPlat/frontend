import { inject, Injectable, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, finalize, switchMap, tap, filter } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

interface ApiError {
  codigoError: string;
  mensaje: string;
  codigoHttp: number;
  url: string;
  metodo: string;
}

import { EscanerDTOPeticion, EscanerDTORespuesta } from '../../models/escaner.model';
import { EnumEstadoEscaner } from '../../enums/enum-estado-escaner';
import { EnumTipoEjecucion } from '../../enums/enum-tipo-ejecucion';
import { EnumMercado } from '../../enums/enum-mercado';
import { EscanerService } from '../../services/escaner.service';
import { EstadoEscanerService } from '../../services/estado-escaner.service';
import { EnumConfigurationCard } from '../../enums/enum-configuration-card';

@Injectable({
  providedIn: 'root'
})
export class ScannerConfigurationService {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly escanerService = inject(EscanerService);
  private readonly estadoEscanerService = inject(EstadoEscanerService);

  // State signals
  scannerId = signal<number | null>(null);
  scannerEstado = signal<EnumEstadoEscaner | null>(null);
  currentScannerData = signal<EscanerDTOPeticion | undefined>(undefined);
  submitted = signal<boolean>(false);
  generalFormValid = signal<boolean>(false);
  timeFormValid = signal<boolean>(false);
  marketFormValid = signal<boolean>(false);
  formTouched = signal<boolean>(false);
  loading = signal<boolean>(false);
  error = signal<ApiError | null>(null);
  loadError = signal<ApiError | null>(null);

  // Computed signals
  isNewScanner = computed(() => !this.scannerId() || this.scannerId() === 0);
  isFormValid = computed(() => this.generalFormValid() && this.timeFormValid() && this.marketFormValid());

  constructor() {
    console.log('ScannerConfigurationService: Constructor called.');
    console.log('ScannerConfigurationService: Snapshot paramMap.get("id"):', this.route.snapshot.paramMap.get('id'));
    console.log('ScannerConfigurationService: Full Snapshot paramMap (stringified):', JSON.stringify(this.route.snapshot.paramMap));
    console.log('ScannerConfigurationService: Snapshot URL segments:', this.route.snapshot.url);


    this.route.paramMap.pipe(
      tap(params => {
        console.log('ScannerConfigurationService: Route param id (from paramMap):', params.get('id'));
        console.log('ScannerConfigurationService: Full paramMap (stringified):', JSON.stringify(params));
      }),
      switchMap(params => {
        const id = +(params.get('id') || 0);
        this.scannerId.set(id);
        this.loading.set(true);
        this.loadError.set(null);

        if (id && id !== 0) {
          return this.escanerService.getEscanerById(id).pipe(
            map(response => this.mapResponseToPeticion(response)),
            catchError((err: HttpErrorResponse) => {
              console.error('Error loading scanner from route:', err);
              this.loadError.set(err.error as ApiError);
              return of(null);
            })
          );
        } else {
          return of(this.getDefaultScannerData());
        }
      }),
      finalize(() => {
        // This finalize block is not reliably setting loading to false,
        // so we will explicitly set it in the subscribe block.
      })
    ).subscribe(data => {
      this.currentScannerData.set(data || undefined);
      // Explicitly set loading to false after data is processed
      this.loading.set(false);
      console.log('currentScannerData after load/default from route:', this.currentScannerData());
      console.log('Current loading state after subscribe:', this.loading());
      if (this.isNewScanner()) {
        this.generalFormValid.set(true);
        this.timeFormValid.set(true);
        this.marketFormValid.set(true);
      }
    });
  }

  updateCardData(cardType: EnumConfigurationCard, data: { nombre?: string | null, descripcion?: string | null, horaInicio?: string | null, horaFin?: string | null, tipoEjecucion?: EnumTipoEjecucion | null, mercados?: { enumMercado: EnumMercado }[] | null }): void {
    this.currentScannerData.update(currentData => {
      if (!currentData) {
        currentData = this.getDefaultScannerData();
      }

      let updatedData = { ...currentData };

      switch (cardType) {
        case EnumConfigurationCard.GENERAL:
          updatedData = { ...updatedData, nombre: data.nombre || '', descripcion: data.descripcion || '' };
          break;
        case EnumConfigurationCard.TIME:
          updatedData = { ...updatedData, horaInicio: data.horaInicio || '', horaFin: data.horaFin || '', objTipoEjecucion: { enumTipoEjecucion: data.tipoEjecucion as EnumTipoEjecucion } };
          break;
        case EnumConfigurationCard.MARKET:
          updatedData = { ...updatedData, mercados: data.mercados?.map((m: { enumMercado: EnumMercado }) => ({ enumMercado: m.enumMercado })) || [] };
          break;
      }
      this.formTouched.set(true);
      return updatedData;
    });
  }

  updateFormValidity(cardType: EnumConfigurationCard, isValid: boolean): void {
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
    }
  }

  saveScannerConfiguration(backPath: string): void {
    this.submitted.set(true);
    this.error.set(null);
    const scannerData = this.currentScannerData();

    if (scannerData && this.isFormValid()) {
      this.loading.set(true);
      console.log('Saving scanner configuration:', scannerData);
      const scannerId = this.scannerId();
      console.log('scannerId:', scannerId);
      console.log('isNewScanner:', this.isNewScanner());
      if (scannerId && scannerId !== 0) {
        this.escanerService.updateEscaner(scannerId, scannerData).pipe(
          finalize(() => this.loading.set(false)),
          catchError((err: HttpErrorResponse) => {
            console.error('Error updating scanner:', err);
            this.error.set(err.error as ApiError);
            return of(null);
          })
        ).subscribe(response => {
          if (response) {
            console.log('Scanner updated successfully:', response);
            this.router.navigate([backPath]);
          }
        });
      } else {
        this.escanerService.createEscaner(scannerData).pipe(
          finalize(() => this.loading.set(false)),
          catchError((err: HttpErrorResponse) => {
            console.error('Error creating scanner:', err);
            this.error.set(err.error as ApiError);
            return of(null);
          })
        ).subscribe(response => {
          if (response) {
            console.log('Scanner created successfully:', response);
            this.router.navigate([backPath]);
          }
        });
      }
    } else {
      console.warn('Form is invalid or no scanner data to save.');
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
    const scannerId = this.scannerId();
    if (scannerId && scannerId !== 0) {
      this.loading.set(true);
      this.saveScannerConfiguration(backPath); // Save first
      this.estadoEscanerService.archivarEscaner(scannerId).pipe(
        finalize(() => this.loading.set(false)),
        catchError((err: HttpErrorResponse) => {
          console.error('Error archiving scanner:', err);
          this.error.set(err.error as ApiError);
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          console.log('Scanner archived successfully:', response);
          this.router.navigate([backPath]);
        }
      });
    } else {
      console.warn('No scanner ID to archive.');
      this.error.set({
        codigoError: 'FE-0002',
        mensaje: 'No se encontró ID de escáner para archivar.',
        codigoHttp: 400,
        url: this.router.url,
        metodo: 'POST'
      });
    }
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
          console.error('Error unarchiving scanner:', err);
          this.error.set(err.error as ApiError);
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          console.log('Scanner unarchived successfully:', response);
          this.router.navigate([backPath]);
        }
      });
    } else {
      console.warn('No scanner ID to unarchive.');
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
          console.error('Error deleting scanner:', err);
          this.error.set(err.error as ApiError);
          return of(false);
        })
      ).subscribe(response => {
        if (response) {
          console.log('Scanner deleted successfully:', response);
          this.router.navigate([backPath]);
          }
        });
      } else {
        console.warn('No scanner ID to delete.');
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