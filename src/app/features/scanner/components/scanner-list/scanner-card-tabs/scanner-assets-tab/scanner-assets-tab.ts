import { ChangeDetectionStrategy, Component, inject, input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Escaner } from '../../../../models/escaner.interface';
import { ActivoApiService } from '../../../../services/activo-api.service';
import { NotificacionSseService } from '../../../../services/notificacion-sse.service';
import { Activo } from '../../../../models/activo.interface';

@Component({
  selector: 'app-scanner-assets-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    TranslatePipe
  ],
  templateUrl: './scanner-assets-tab.html',
  styleUrl: './scanner-assets-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerAssetsTab implements OnInit, OnDestroy {
  private readonly activoApiService = inject(ActivoApiService);
  private readonly notificacionSseService = inject(NotificacionSseService);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['symbol', 'estado', 'fechaDeteccion', 'fechaActualizacion', 'details'];
  dataSource = signal<Activo[]>([]);
  loading = signal<boolean>(false);

  private sseSubscription?: Subscription;

  ngOnInit(): void {
    this.loadAssets();
    this.subscribeToUpdates();
  }

  ngOnDestroy(): void {
    this.sseSubscription?.unsubscribe();
    this.notificacionSseService.desconectar();
  }

  loadAssets(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;

    this.loading.set(true);

    this.activoApiService.getActivosPorEscaner(scannerId).subscribe({
      next: (activos) => {
        this.dataSource.set(activos);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando activos:', error);
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
          // Si es una notificación de tipo SIGNAL o asset-state, recargar activos
          if (notificacion.categoria === 'SIGNAL' || notificacion.tipo === 'LOG') {
            this.loadAssets();
          }
        },
        error: (error) => {
          console.error('Error en SSE:', error);
        }
      });
  }

  onViewDetails(activo: Activo): void {
    console.log('Ver detalles de activo:', activo);
    // TODO: Implementar modal o navegación para ver detalles
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'ACTIVO':
        return 'primary';
      case 'ELIMINADO':
        return 'warn';
      default:
        return 'accent';
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
      minute: '2-digit'
    });
  }
}
