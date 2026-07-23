import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { LogApiService } from '../../../../services/log-api.service';
import { ScannerDataStore } from '../../../../services/scanner-data-store.service';
import { RegistroLog } from '../../../../models/registro-log.interface';
import { LocalDatetimePipe } from '../../../../../../shared/pipes/local-datetime.pipe';

@Component({
  selector: 'app-scanner-registry-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    TranslatePipe,
    LocalDatetimePipe
  ],
  templateUrl: './scanner-registry-tab.html',
  styleUrl: './scanner-registry-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerRegistryTab implements OnInit {
  private readonly logApiService = inject(LogApiService);
  private readonly dataStore = inject(ScannerDataStore);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['timestamp', 'nivel', 'categoria', 'mensaje'];
  dataSource = signal<RegistroLog[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    this.loading.set(true);

    this.dataStore.loadLogs(scannerId, this.logApiService, (logs) => {
      this.dataSource.set(logs);
      this.loading.set(false);
    });
  }

  loadRegistry(): void {}

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

}
