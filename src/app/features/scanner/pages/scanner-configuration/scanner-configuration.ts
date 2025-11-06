import { ChangeDetectionStrategy, Component, computed, inject, model, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NavbarButton } from '../../../../shared/models/interface/navbar-button.interface';
import { HeaderNavbar } from '../../../../shared/components/layout/header-navbar/header-navbar';
import { CardGeneral } from "../../components/scanner-configuration/card-general/card-general";
import { PageLoading } from '../../../../shared/components/ui/page-loading/page-loading';
import { PageError } from '../../../../shared/components/ui/page-error/page-error';
import { ScannerFacadeService } from '../../services/scanner-facade.service';
import { Escaner } from '../../models/escaner.interface';
import { Filtro } from '../../models/filtro.interface';
import { CardTime } from "../../components/scanner-configuration/card-time/card-time";
import { CardMarket } from '../../components/scanner-configuration/card-market/card-market';
import { CardSelectedFilters } from "../../components/scanner-configuration/card-selected-filters/card-selected-filters";
import { MatDialog } from '@angular/material/dialog';
import { DialogAddFilters } from '../../components/scanner-configuration/dialog-add-filters/dialog-add-filters';
import { isValidationErrorResponse, isScannerFieldErrors, ValidationErrorResponse, ScannerFieldErrors } from '../../models/api-error.interface';
import { I18nService } from '../../../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-scanner-configuration',
  imports: [
    HeaderNavbar,
    CardGeneral,
    PageLoading,
    PageError,
    CardTime,
    CardMarket,
    CardSelectedFilters
],
  templateUrl: './scanner-configuration.html',
  styleUrl: './scanner-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerConfiguration implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(ScannerFacadeService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly i18nService = inject(I18nService);

  // Estado del componente
  readonly backPath = "/escaneres";
  readonly scanner = model<Escaner>(this.createEmptyScanner());
  readonly filtros = model<Filtro[]>([]);
  readonly validationErrors = signal<Record<string, Record<string, string>>>({});
  readonly scannerErrors = signal<Record<string, string>>({});
  readonly loading = this.facade.loading;
  readonly error = this.facade.error;
  readonly isEditMode = signal<boolean>(false);
  readonly scannerId = signal<number | null>(null);
  readonly mercados = this.facade.mercados;

  readonly title = computed(() => {
    // Hacer que el computed dependa del idioma actual
    const currentLang = this.i18nService.currentLocale();
    return this.isEditMode()
      ? this.translate.instant('SCANNER.CONFIGURE_TITLE')
      : this.translate.instant('SCANNER.NEW_SCANNER');
  });

  readonly navButtons = computed((): NavbarButton[] => {
    // Hacer que el computed dependa del idioma actual
    const currentLang = this.i18nService.currentLocale();
    const buttons: NavbarButton[] = [
      {
        id: 1,
        icon: "bi bi-save2-fill",
        label: this.translate.instant('SCANNER.SAVE'),
        action: "save"
      }
    ];

    // Si es modo edición (tiene ID)
    if (this.isEditMode()) {
      const isArchived = this.scanner().objEstado?.enumEstadoEscaner === 'ARCHIVADO';

      // Botón de archivar/desarchivar según el estado
      buttons.push({
        id: 2,
        icon: isArchived ? "bi bi-journal-arrow-up" : "bi bi-journal-arrow-down",
        label: isArchived ? this.translate.instant('SCANNER.UNARCHIVE') : this.translate.instant('SCANNER.ARCHIVE'),
        action: isArchived ? "unarchive" : "archive"
      });

      // Botón eliminar solo en modo edición
      buttons.push({
        id: 3,
        icon: "bi bi-trash-fill",
        label: this.translate.instant('SCANNER.DELETE'),
        action: "delete"
      });
    }

    return buttons;
  });

  ngOnInit(): void {
    this.facade.loadMercados().subscribe();
    this.route.params.subscribe(params => {
      const id = params['id'];
      
      if (id) {
        // Modo edición - cargar escáner existente
        this.isEditMode.set(true);
        this.scannerId.set(+id);
        this.loadScanner(+id);
      } else {
        // Modo creación - usar escáner vacío
        this.isEditMode.set(false);
        this.scannerId.set(null);
        this.scanner.set(this.createEmptyScanner());
      }
    });
  }

  private loadScanner(id: number): void {
    this.facade.getEscanerById(id).subscribe({
      next: (escaner) => {
        this.scanner.set(escaner);
        // Cargar filtros del escaner
        this.loadFiltrosEscaner(id);
      },
      error: (error) => {
        console.error('Error al cargar el escáner:', error);
      }
    });
  }

  private loadFiltrosEscaner(idEscaner: number): void {
    this.facade.loadFiltrosEscaner(idEscaner).subscribe({
      next: (filtros) => {
        this.filtros.set(filtros);
      },
      error: (error) => {
        console.error('Error al cargar los filtros del escáner:', error);
        // En caso de error, establecer array vacío
        this.filtros.set([]);
      }
    });
  }

  private createEmptyScanner(): Escaner {
    return {
      nombre: '',
      descripcion: '',
      horaInicio: '',
      horaFin: '',
      mercados: [],
      objTipoEjecucion: {
        etiqueta: '',
        enumTipoEjecucion: 'UNA_VEZ'  // Valor por defecto
      }
    };
  }

  reloadPage(): void {
    if (this.isEditMode() && this.scannerId()) {
      this.loadScanner(this.scannerId()!);
    } else {
      this.facade.clearError();
      this.scanner.set(this.createEmptyScanner());
      this.filtros.set([]);
    }
  }

  selectAction(action: string): void {
    const currentScanner = this.scanner();
    const scannerId = this.scannerId();
    const currentFiltros = this.filtros();

    switch (action) {
      case 'save':
        this.saveAll(currentScanner, scannerId, currentFiltros, () => {
          this.router.navigate(['/escaneres']);
        });
        break;

      case 'archive':
        if (scannerId) {
          this.saveAll(currentScanner, scannerId, currentFiltros, () => {
            this.facade.archivarEscaner(scannerId).subscribe({
              next: () => {
                this.router.navigate(['/escaneres']);
              },
              error: (err) => {
                console.error('Error al archivar el escáner:', err);
              }
            });
          });
        }
        break;

      case 'unarchive':
        if (scannerId) {
          this.saveAll(currentScanner, scannerId, currentFiltros, () => {
            this.facade.desarchivarEscaner(scannerId).subscribe({
              next: () => {
                this.router.navigate(['/escaneres']);
              },
              error: (err) => {
                console.error('Error al desarchivar el escáner:', err);
              }
            });
          });
        }
        break;

      case 'delete':
        if (scannerId) {
          this.facade.deleteEscaner(scannerId).subscribe({
            next: () => {
              this.router.navigate(['/escaneres']);
            },
            error: (err) => {
              console.error('Error al eliminar el escáner:', err);
            }
          });
        }
        break;

      default:
        console.warn(`Acción no reconocida: ${action}`);
        break;
    }
  }

  /**
   * Guarda el escaner y los filtros
   * Siempre guarda ambos, independientemente de si hay cambios o no
   */
  private saveAll(
    scanner: Escaner, 
    scannerId: number | null, 
    filtros: Filtro[], 
    onSuccess: () => void
  ): void {
    if (this.isEditMode() && scannerId) {
      // Modo edición: actualizar escaner y guardar filtros
      this.facade.updateEscaner(scannerId, scanner).subscribe({
        next: (updatedScanner) => {
          this.scanner.set(updatedScanner);
          // Siempre guardar filtros usando Silent para no mostrar loading/error global
          this.facade.guardarFiltrosEscanerSilent(scannerId, filtros).subscribe({
            next: (filtrosGuardados) => {
              this.filtros.set(filtrosGuardados);
              this.validationErrors.set({}); // Limpiar errores de filtros si guardó exitosamente
              this.scannerErrors.set({}); // Limpiar errores de scanner si guardó exitosamente
              onSuccess();
            },
            error: (err) => {
              console.error('Error al guardar los filtros:', err);
              this.handleValidationErrors(err);
              // NO continuar si falla el guardado de filtros
            }
          });
        },
        error: (err) => {
          console.error('Error al actualizar el escáner:', err);
          this.handleScannerValidationErrors(err);
        }
      });
    } else {
      // Modo creación: crear escaner y guardar filtros
      this.facade.createEscaner(scanner).subscribe({
        next: (newScanner) => {
          this.scanner.set(newScanner);
          this.isEditMode.set(true);
          const newId = newScanner.idEscaner!;
          this.scannerId.set(newId);
          
          // Guardar filtros después de crear el escaner usando Silent
          this.facade.guardarFiltrosEscanerSilent(newId, filtros).subscribe({
            next: (filtrosGuardados) => {
              this.filtros.set(filtrosGuardados);
              this.validationErrors.set({}); // Limpiar errores de filtros si guardó exitosamente
              this.scannerErrors.set({}); // Limpiar errores de scanner si guardó exitosamente
              onSuccess();
            },
            error: (err) => {
              console.error('Error al guardar los filtros:', err);
              this.handleValidationErrors(err);
              // NO continuar si falla el guardado de filtros
            }
          });
        },
        error: (err) => {
          console.error('Error al crear el escáner:', err);
          this.handleScannerValidationErrors(err);
        }
      });
    }
  }

  onOpenAddDialog(): void {
    // Obtener los enums de los filtros ya seleccionados
    const selectedFilterEnums = this.filtros().map(f => f.enumFiltro);

    const dialogRef = this.dialog.open(DialogAddFilters, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        excludedFilters: selectedFilterEnums
      }
    });

    dialogRef.afterClosed().subscribe({
      next: (enumFiltro) => {
        if (!enumFiltro) {
          return;
        }

        this.facade.getFiltroPorDefectoSilent(enumFiltro).subscribe({
          next: (filtroConDefecto) => {
            const currentFilters = this.filtros();
            this.filtros.set([...currentFilters, filtroConDefecto]);
          },
          error: (err) => {
            console.error('Error al obtener filtro por defecto:', err);
          }
        });
      }
    });
  }

  onRemoveFilter(index: number): void {
    const currentFilters = this.filtros();
    this.filtros.set(currentFilters.filter((_, i) => i !== index));
  }

  /**
   * Maneja errores de validación de filtros usando la nueva estructura del backend.
   *
   * El backend ahora retorna:
   * {
   *   codigoError: "GC-0005",
   *   mensaje: "Error de validación en los filtros configurados",
   *   codigoHttp: 400,
   *   url: "/api/escaner/filtro/escaner/123",
   *   metodo: "POST",
   *   erroresValidacion: [
   *     {
   *       filtro: "RSI",
   *       parametro: "PERIODO_RSI",
   *       mensaje: "El período debe ser mayor que 0",
   *       filtroIndex: null
   *     }
   *   ]
   * }
   *
   * Esta nueva estructura permite:
   * - Identificar exactamente a qué filtro pertenece cada error
   * - Mostrar mensajes de error contextualizados
   * - Manejar múltiples filtros del mismo tipo
   */
  private handleValidationErrors(err: any): void {
    if (err.error && isValidationErrorResponse(err.error)) {
      const response: ValidationErrorResponse = err.error;
      const errors: Record<string, Record<string, string>> = {};

      // Mapear errores usando la estructura mejorada del backend
      response.erroresValidacion.forEach(detail => {
        if (!errors[detail.filtro]) {
          errors[detail.filtro] = {};
        }
        errors[detail.filtro][detail.parametro] = detail.mensaje;
      });

      this.validationErrors.set(errors);
      this.scannerErrors.set({}); // Limpiar errores del scanner cuando hay errores de filtros
    } else {
      // Fallback para errores sin la nueva estructura
      console.error('Error de validación en formato inesperado:', err);
    }
  }

  /**
   * Maneja errores de validación de campos del scanner (nombre, descripción, etc.).
   *
   * El backend ahora retorna estructura RFC 7807:
   * {
   *   codigoError: "GC-0005",
   *   mensaje: "nombre: El nombre del escáner es obligatorio; horaInicio: La hora de inicio debe ser anterior a la hora de fin",
   *   codigoHttp: 400,
   *   url: "http://localhost:8080/api/escaner",
   *   metodo: "POST"
   * }
   *
   * Parsea el mensaje para extraer los errores de cada campo.
   */
  private handleScannerValidationErrors(err: any): void {
    // Limpiar errores de filtros cuando hay errores de scanner
    this.validationErrors.set({});

    // // DEBUG: Ver estructura completa del error
    // console.log('=== DEBUG ERROR ESTRUCTURA ===');
    // console.log('err:', err);
    // console.log('err.error:', err.error);
    // console.log('err.error.codigoError:', err.error?.codigoError);
    // console.log('err.error.mensaje:', err.error?.mensaje);
    // console.log('=============================');

    // Verificar si es estructura RFC 7807
    if (err.error && err.error.codigoError && err.error.mensaje) {
      const mensaje = err.error.mensaje;
      const errors: Record<string, string> = {};

      // console.log('Mensaje a parsear:', mensaje);

      // El mensaje viene en formato: "campo1: mensaje1; campo2: mensaje2"
      // Parsear el mensaje para extraer los errores
      const parts = mensaje.split(';').map((part: string) => part.trim());

      parts.forEach((part: string) => {
        const colonIndex = part.indexOf(':');
        if (colonIndex > 0) {
          const campo = part.substring(0, colonIndex).trim();
          const mensajeError = part.substring(colonIndex + 1).trim();
          errors[campo] = mensajeError;
        }
      });

      // console.log('Errores parseados:', errors);

      // Si no se pudo parsear (mensaje sin formato "campo: mensaje"),
      // intentar detectar el campo por el contexto del mensaje
      if (Object.keys(errors).length === 0) {
        // Detectar si es un error de formato de datos (deserialización)
        const isFormatError = mensaje.toLowerCase().includes('formato') ||
                             mensaje.toLowerCase().includes('válido') ||
                             mensaje.toLowerCase().includes('invalid');

        if (isFormatError) {
          // Es un error de formato, probablemente de los campos de hora
          // Mostrar el error en ambos campos de tiempo como fallback
          errors['horaInicio'] = mensaje;
          errors['horaFin'] = mensaje;
          // console.log('Error de formato detectado, asignando a campos de tiempo');
        } else {
          // Si no es error de formato, mostrar como general
          errors['general'] = mensaje;
        }
      }

      console.log('Setting scannerErrors con:', errors);
      this.scannerErrors.set(errors);
    } else if (err.error && isScannerFieldErrors(err.error)) {
      // Fallback: formato antiguo (mapa simple de campo -> mensaje)
      this.scannerErrors.set(err.error as ScannerFieldErrors);
      this.validationErrors.set({}); // Limpiar errores de filtros cuando hay errores de scanner
    } else {
      // Fallback para errores sin estructura esperada
      console.error('Error de validación de scanner en formato inesperado:', err);
      this.scannerErrors.set({
        general: err.error?.mensaje || err.message || 'Error desconocido'
      });
    }
  }
}
