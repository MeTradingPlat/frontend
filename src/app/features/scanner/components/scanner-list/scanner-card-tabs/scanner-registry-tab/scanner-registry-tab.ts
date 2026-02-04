import { ChangeDetectionStrategy, Component, inject, input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Escaner } from '../../../../models/escaner.interface';
import { LogApiService } from '../../../../services/log-api.service';
import { NotificacionSseService } from '../../../../services/notificacion-sse.service';
import { RegistroLog } from '../../../../models/registro-log.interface';

@Component({
  selector: 'app-scanner-registry-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    TranslatePipe
  ],
  templateUrl: './scanner-registry-tab.html',
  styleUrl: './scanner-registry-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerRegistryTab implements OnInit, OnDestroy {
  private readonly logApiService = inject(LogApiService);
  private readonly notificacionSseService = inject(NotificacionSseService);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['timestamp', 'nivel', 'categoria', 'mensaje'];
  dataSource = signal<RegistroLog[]>([]);
  loading = signal<boolean>(false);

  private sseSubscription?: Subscription;

  ngOnInit(): void {
    this.loadRegistry();
    this.subscribeToUpdates();
  }

  ngOnDestroy(): void {
    this.sseSubscription?.unsubscribe();
  }

  loadRegistry(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;

    this.loading.set(true);

    this.logApiService.getLogsPorEscaner(scannerId).subscribe({
      next: (logs) => {
        // Ordenar por fecha descendente (más recientes primero)
        const sortedLogs = logs.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.dataSource.set(sortedLogs);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando registros:', error);
        this.dataSource.set([]);
        this.loading.set(false);
      }
    });
  }

  /**
   * Suscribirse a actualizaciones en tiempo real via SSE
   */
  private subscribeToUpdates(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;

    this.sseSubscription = this.notificacionSseService
      .conectarPorEscaner(scannerId)
      .subscribe({
        next: (notificacion) => {
          // Agregar nuevo log al inicio de la lista
          const nuevoLog: RegistroLog = {
            idRegistroLog: parseInt(notificacion.id) || 0,
            servicioOrigen: 'notification-service',
            nivel: notificacion.nivel,
            mensaje: notificacion.mensaje,
            idEscaner: notificacion.idEscaner,
            symbol: notificacion.symbol,
            categoria: notificacion.categoria,
            timestamp: notificacion.timestamp
          };

          const currentLogs = this.dataSource();
          this.dataSource.set([nuevoLog, ...currentLogs.slice(0, 99)]); // Mantener máximo 100 registros
        },
        error: (error) => {
          console.error('Error en SSE:', error);
        }
      });
  }

  getNivelColor(nivel: string): string {
    switch (nivel?.toUpperCase()) {
      case 'ERROR':
        return 'warn';
      case 'WARN':
        return 'accent';
      case 'INFO':
        return 'primary';
      case 'DEBUG':
        return '';
      default:
        return '';
    }
  }

  getCategoriaIcon(categoria: string): string {
    switch (categoria?.toUpperCase()) {
      case 'SIGNAL':
        return 'bi-lightning-fill';
      case 'ORDER':
        return 'bi-cart-fill';
      case 'SCANNER':
        return 'bi-search';
      case 'FILTER':
        return 'bi-funnel-fill';
      case 'SYSTEM':
        return 'bi-gear-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
