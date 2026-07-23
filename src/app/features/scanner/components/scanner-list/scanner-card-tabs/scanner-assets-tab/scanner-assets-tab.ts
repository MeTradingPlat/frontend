import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { ActivoApiService } from '../../../../services/activo-api.service';
import { ScannerDataStore } from '../../../../services/scanner-data-store.service';
import { Activo } from '../../../../models/activo.interface';
import { LocalDatetimePipe } from '../../../../../../shared/pipes/local-datetime.pipe';

@Component({
  selector: 'app-scanner-assets-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    TranslatePipe,
    LocalDatetimePipe
  ],
  templateUrl: './scanner-assets-tab.html',
  styleUrl: './scanner-assets-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerAssetsTab implements OnInit {
  private readonly activoApiService = inject(ActivoApiService);
  private readonly dataStore = inject(ScannerDataStore);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['symbol', 'estado', 'fechaDeteccion', 'fechaActualizacion', 'details'];
  dataSource = signal<Activo[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    this.loading.set(true);

    this.dataStore.loadAssets(scannerId, this.activoApiService, (activos) => {
      this.dataSource.set(activos);
      this.loading.set(false);
    });
  }

  loadAssets(): void {}

  onViewDetails(activo: Activo): void {
    console.log('Ver detalles de activo:', activo);
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

}
