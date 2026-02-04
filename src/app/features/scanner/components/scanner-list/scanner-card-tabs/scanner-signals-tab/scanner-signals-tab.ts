import { ChangeDetectionStrategy, Component, inject, input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Escaner } from '../../../../models/escaner.interface';
import { LogApiService } from '../../../../services/log-api.service';
import { NotificacionSseService } from '../../../../services/notificacion-sse.service';

interface SignalRow {
  id: number;
  timestamp: string;
  symbol: string;
  tipo: string;
  mensaje: string;
  metadatos?: string;
}

@Component({
  selector: 'app-scanner-signals-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    TranslatePipe
  ],
  templateUrl: './scanner-signals-tab.html',
  styleUrl: './scanner-signals-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerSignalsTab implements OnInit, OnDestroy {
  private readonly logApiService = inject(LogApiService);
  private readonly notificacionSseService = inject(NotificacionSseService);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['timestamp', 'symbol', 'tipo', 'mensaje', 'details'];
  dataSource = signal<SignalRow[]>([]);
  loading = signal<boolean>(false);

  private sseSubscription?: Subscription;

  ngOnInit(): void {
    this.loadSignals();
    this.subscribeToUpdates();
  }

  ngOnDestroy(): void {
    this.sseSubscription?.unsubscribe();
  }

  loadSignals(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;

    this.loading.set(true);

    // Cargar logs con categoría SIGNAL
    this.logApiService.getLogsPorEscaner(scannerId).subscribe({
      next: (logs) => {
        // Filtrar solo los de categoría SIGNAL y mapear a SignalRow
        const signals = logs
          .filter(log => log.categoria === 'SIGNAL')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .map(log => ({
            id: log.idRegistroLog,
            timestamp: log.timestamp,
            symbol: log.symbol || '-',
            tipo: this.extractTipoFromMensaje(log.mensaje),
            mensaje: log.mensaje,
            metadatos: log.metadatos
          }));

        this.dataSource.set(signals);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando señales:', error);
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
          // Solo procesar notificaciones de tipo SIGNAL
          if (notificacion.categoria === 'SIGNAL') {
            const nuevaSenal: SignalRow = {
              id: parseInt(notificacion.id) || 0,
              timestamp: notificacion.timestamp,
              symbol: notificacion.symbol || '-',
              tipo: this.extractTipoFromMensaje(notificacion.mensaje),
              mensaje: notificacion.mensaje
            };

            const currentSignals = this.dataSource();
            this.dataSource.set([nuevaSenal, ...currentSignals.slice(0, 49)]); // Mantener máximo 50 señales
          }
        },
        error: (error) => {
          console.error('Error en SSE:', error);
        }
      });
  }

  /**
   * Extrae el tipo de señal del mensaje
   */
  private extractTipoFromMensaje(mensaje: string): string {
    if (mensaje.toLowerCase().includes('entrada')) return 'ENTRADA';
    if (mensaje.toLowerCase().includes('salida')) return 'SALIDA';
    if (mensaje.toLowerCase().includes('generada')) return 'NUEVA';
    return 'SIGNAL';
  }

  onViewDetails(signal: SignalRow): void {
    console.log('Ver detalles de señal:', signal);
    // TODO: Implementar modal para ver detalles y metadatos
  }

  getTipoColor(tipo: string): string {
    switch (tipo?.toUpperCase()) {
      case 'ENTRADA':
      case 'NUEVA':
        return 'primary';
      case 'SALIDA':
        return 'accent';
      default:
        return '';
    }
  }

  getTipoIcon(tipo: string): string {
    switch (tipo?.toUpperCase()) {
      case 'ENTRADA':
      case 'NUEVA':
        return 'bi-arrow-up-circle-fill';
      case 'SALIDA':
        return 'bi-arrow-down-circle-fill';
      default:
        return 'bi-lightning-fill';
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
