import { ChangeDetectionStrategy, Component, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PageLoading } from '../../../../shared/components/ui/page-loading/page-loading';
import { HeaderNavbar } from "../../../../shared/components/layout/header-navbar/header-navbar";
import { PageError } from '../../../../shared/components/ui/page-error/page-error';
import { NavbarButton } from '../../../../shared/models/interface/navbar-button.interface';
import { Escaner } from '../../models/escaner.interface';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ScannerFacadeService } from '../../services/scanner-facade.service';
import { ScannerCardComponent } from '../../components/scanner-list/scanner-card/scanner-card';
import { DialogScannerExpand } from '../../components/scanner-list/scanner-card/scanner-dialog/dialog-scanner-expand';
import { I18nService } from '../../../../core/services/i18n/i18n.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { ScannerApiService } from '../../services/scanner-api.service';
import { NotificacionSseService } from '../../services/notificacion-sse.service';
import { MetadatosEstadoEscaner } from '../../models/notificacion.interface';

@Component({
  selector: 'app-scanner-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    HeaderNavbar,
    PageLoading,
    PageError,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatDialogModule,
    MatIconModule,
    ScannerCardComponent
  ],
  templateUrl: './scanner-list.html',
  styleUrl: './scanner-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerList implements OnInit, OnDestroy {
  private readonly facade = inject(ScannerFacadeService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly i18nService = inject(I18nService);
  private readonly notificationService = inject(NotificationService);
  private readonly scannerApi = inject(ScannerApiService);
  private readonly notificacionSseService = inject(NotificacionSseService);

  private sseSubscription?: Subscription;

  readonly scanners = this.facade.escaners;
  readonly loading = this.facade.loading;
  readonly error = this.facade.error;

  readonly title = computed(() => {
    // Hacer que el computed dependa del idioma actual
    const currentLang = this.i18nService.currentLocale();
    return this.translate.instant('SCANNER.TITLE');
  });

  readonly navButtons = computed((): NavbarButton[] => {
    // Hacer que el computed dependa del idioma actual
    const currentLang = this.i18nService.currentLocale();
    return [
      {
        id: 1,
        icon: "bi bi-archive-fill",
        routerLink: "/escaneres/archivados",
        label: this.translate.instant('SCANNER.ARCHIVED')
      },
      {
        id: 2,
        icon: "bi bi-journal-plus",
        routerLink: "/escaneres/nuevo",
        label: this.translate.instant('SCANNER.NEW')
      }
    ];
  });

  ngOnInit(): void {
    // Siempre forzar recarga desde la API para tener datos actualizados
    this.facade.loadEscaners(true).subscribe();
    // Suscribirse a cambios de estado en tiempo real
    this.subscribeToStateChanges();
  }

  ngOnDestroy(): void {
    this.sseSubscription?.unsubscribe();
    this.notificacionSseService.desconectar();
  }

  private subscribeToStateChanges(): void {
    this.sseSubscription = this.notificacionSseService.conectar().subscribe({
      next: (notificacion) => {
        if (notificacion.tipo === 'SCANNER_STATE' && notificacion.idEscaner) {
          this.handleStateChange(notificacion);
        }
      },
      error: (error) => {
        console.error('Error en SSE de estados:', error);
      }
    });
  }

  private handleStateChange(notificacion: any): void {
    if (!notificacion.metadatos) return;

    try {
      const metadatos: MetadatosEstadoEscaner = JSON.parse(notificacion.metadatos);
      const idEscaner = notificacion.idEscaner!;

      // Actualizar el estado local del escaner
      const currentScanners = this.scanners();
      const updatedScanners = currentScanners.map(scanner => {
        if (scanner.idEscaner === idEscaner) {
          return {
            ...scanner,
            objEstado: {
              ...scanner.objEstado,
              enumEstadoEscaner: metadatos.estadoNuevo,
              fechaRegistro: notificacion.timestamp
            }
          };
        }
        return scanner;
      });

      // Forzar actualizacion del signal
      this.facade.escaners.set(updatedScanners);

      // Mostrar notificacion al usuario
      const scannerName = this.getScannerName(idEscaner);
      const mensaje = `Escaner "${scannerName}" cambio a ${metadatos.estadoNuevo}`;
      if (metadatos.estadoNuevo === 'DETENIDO') {
        this.notificationService.showInfo(mensaje);
      } else if (metadatos.estadoNuevo === 'INICIADO') {
        this.notificationService.showSuccess(mensaje);
      }

    } catch (e) {
      console.error('Error parseando metadatos de estado:', e);
    }
  }

  private getScannerName(id: number): string {
    const scanner = this.scanners().find(s => s.idEscaner === id);
    return scanner?.nombre || `ID:${id}`;
  }


  reloadPage(): void {
    // Forzar recarga desde el servidor para reintentar la conexión
    this.facade.loadEscaners(true).subscribe();
  }

  onEditScanner(id: number): void {
    // La navegación se maneja en el template con routerLink
  }

  onToggleScannerStatus(id: number): void {
    const scanner = this.scanners().find(s => s.idEscaner === id);
    if (!scanner) return;

    const isRunning = scanner.objEstado?.enumEstadoEscaner === 'INICIADO';

    const action$ = isRunning
      ? this.scannerApi.detenerEscaner(id)
      : this.scannerApi.iniciarEscaner(id);

    action$.subscribe({
      next: (nuevoEstado) => {
        // Usar interpolación de strings para evitar problemas con translate.instant
        const message = isRunning
          ? `${this.translate.instant('SCANNER.STOPPED_SUCCESS').replace('{{name}}', scanner.nombre).replace('"{{name}}"', `"${scanner.nombre}"`)}`
          : `${this.translate.instant('SCANNER.STARTED_SUCCESS').replace('{{name}}', scanner.nombre).replace('"{{name}}"', `"${scanner.nombre}"`)}`;
        this.notificationService.showSuccess(message);

        // Actualizar el estado local inmediatamente con la respuesta de la API
        const currentScanners = this.scanners();
        const updatedScanners = currentScanners.map(s => {
          if (s.idEscaner === id) {
            return {
              ...s,
              objEstado: nuevoEstado
            };
          }
          return s;
        });
        this.facade.escaners.set(updatedScanners);
      },
      error: (err) => {
        const errorMessage = err?.error?.mensaje || err?.message || this.translate.instant('SCANNER.STATE_CHANGE_ERROR');
        this.notificationService.showError(errorMessage);
      }
    });
  }

  onViewScannerDetails(scanner: Escaner): void {
    this.openScannerDialog(scanner);
  }

  openScannerDialog(scanner: Escaner): void {
    this.dialog.open(DialogScannerExpand, {
      width: '90vw',
      maxWidth: '1400px',
      height: '90vh',
      data: scanner,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
      panelClass: 'scanner-dialog-panel'
    });
  }
}
