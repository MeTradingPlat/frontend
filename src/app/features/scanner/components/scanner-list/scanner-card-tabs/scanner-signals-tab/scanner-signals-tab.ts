import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { ScannerDataStore } from '../../../../services/scanner-data-store.service';
import { LogApiService } from '../../../../services/log-api.service';
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

interface DateOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-scanner-signals-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatButtonToggleModule,
    TranslatePipe,
    LocalDatetimePipe
  ],
  templateUrl: './scanner-signals-tab.html',
  styleUrl: './scanner-signals-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerSignalsTab implements OnInit {
  private readonly dataStore = inject(ScannerDataStore);
  private readonly logApi = inject(LogApiService);
  private readonly dialog = inject(MatDialog);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['timestamp', 'symbol', 'tipo', 'details'];
  dataSource = signal<SignalRow[]>([]);
  loading = signal<boolean>(false);
  availableDates = signal<DateOption[]>([]);
  selectedDate = signal<string>('');

  ngOnInit(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    this.loading.set(true);

    this.logApi.getFechasSenial(scannerId).subscribe({
      next: (fechas: string[]) => {
        const today = new Date().toISOString().split('T')[0];
        const dates: DateOption[] = [
          { value: today, label: 'Hoy' },
          ...fechas
            .filter(f => f !== today)
            .map(f => ({ value: f, label: this._formatDateLabel(f) }))
        ];
        this.availableDates.set(dates);
        this.selectedDate.set(today);
        this._loadForDate(today);
      },
      error: () => {
        const today = new Date().toISOString().split('T')[0];
        this.availableDates.set([{ value: today, label: 'Hoy' }]);
        this.selectedDate.set(today);
        this._loadForDate(today);
      }
    });
  }

  onDateChange(fecha: string): void {
    this.selectedDate.set(fecha);
    this.loading.set(true);
    this._loadForDate(fecha);
  }

  private _loadForDate(fecha: string): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    const today = new Date().toISOString().split('T')[0];
    this.dataStore.loadSignals(scannerId, (signals) => {
      this.dataSource.set(signals);
      this.loading.set(false);
    }, fecha !== today ? fecha : undefined);
  }

  private _formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  onViewDetails(signal: SignalRow): void {
    const { precio, matches } = this.parseMetadatos(signal.metadatos);
    this.dialog.open(SymbolDetailsComponent, {
      data: { symbol: signal.symbol, mensaje: signal.mensaje, buyPrice: precio, signalMatches: matches },
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'premium-dialog'
    });
  }

  private parseMetadatos(metadatos?: string): { precio?: number; matches?: SignalFilterMatch[] } {
    if (!metadatos) return {};
    try {
      const parsed = JSON.parse(metadatos);
      if (Array.isArray(parsed)) {
        if (parsed.every(m => typeof m?.timeframe === 'string' && typeof m?.velaTimestamp === 'string')) {
          return { matches: parsed as SignalFilterMatch[] };
        }
      } else if (parsed && Array.isArray(parsed.matches)) {
        return {
          precio: typeof parsed.precio === 'number' ? parsed.precio : undefined,
          matches: parsed.matches as SignalFilterMatch[]
        };
      }
    } catch {
      // ignorado -- ver comentario arriba
    }
    return {};
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
