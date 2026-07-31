import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { ScannerDataStore } from '../../../../services/scanner-data-store.service';
import { LocalDatetimePipe } from '../../../../../../shared/pipes/local-datetime.pipe';
import { SymbolDetailsComponent } from '../../../../../screener/components/symbol-details/symbol-details.component';
import { SignalFilterMatch } from '../../../../../screener/models/candle.models';

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
    TranslatePipe,
    LocalDatetimePipe
  ],
  templateUrl: './scanner-signals-tab.html',
  styleUrl: './scanner-signals-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerSignalsTab implements OnInit {
  private readonly dataStore = inject(ScannerDataStore);
  private readonly dialog = inject(MatDialog);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['timestamp', 'symbol', 'tipo', 'details'];
  dataSource = signal<SignalRow[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    this.loading.set(true);

    this.dataStore.loadSignals(scannerId, (signals) => {
      this.dataSource.set(signals);
      this.loading.set(false);
    });
  }

  loadSignals(): void {
    // Para compatibilidad - el store ya maneja la carga
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
    this.dialog.open(SymbolDetailsComponent, {
      data: { symbol: signal.symbol, signalMatches: this.parseSignalMatches(signal.metadatos) },
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'premium-dialog'
    });
  }

  // Filas antiguas (o un parseo fallido) traen la forma plana previa o nada
  // -- se abre igual el dialogo, solo sin timeframe/marcador preseleccionados.
  private parseSignalMatches(metadatos?: string): SignalFilterMatch[] | undefined {
    if (!metadatos) return undefined;
    try {
      const parsed = JSON.parse(metadatos);
      if (Array.isArray(parsed) && parsed.every(m => typeof m?.timeframe === 'string' && typeof m?.velaTimestamp === 'string')) {
        return parsed as SignalFilterMatch[];
      }
    } catch {
      // ignorado -- ver comentario arriba
    }
    return undefined;
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

}
