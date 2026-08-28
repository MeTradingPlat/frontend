import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { ScannerDataStore } from '../../../../services/scanner-data-store.service';
import { LogApiService } from '../../../../services/log-api.service';
import { MarketDatetimePipe } from '../../../../../../shared/pipes/market-datetime.pipe';
import { SymbolDetailsComponent } from '../../../../../screener/components/symbol-details/symbol-details.component';
import { SignalFilterMatch } from '../../../../../screener/models/candle.models';
import { I18nService } from '../../../../../../core/services/i18n/i18n.service';

interface SignalRow {
  id: number;
  numero: number;
  timestamp: string;
  symbol: string;
  tipo: string;
  mensaje: string;
  metadatos?: string;
}

interface DateOption {
  value: string;
  isToday: boolean;
}

@Component({
  selector: 'app-scanner-signals-tab',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslatePipe,
    MarketDatetimePipe
  ],
  templateUrl: './scanner-signals-tab.html',
  styleUrl: './scanner-signals-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerSignalsTab implements OnInit {
  private readonly dataStore = inject(ScannerDataStore);
  private readonly logApi = inject(LogApiService);
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['numero', 'timestamp', 'symbol', 'tipo', 'details'];
  dataSource = signal<SignalRow[]>([]);
  loading = signal<boolean>(false);
  availableDates = signal<DateOption[]>([]);
  selectedDate = signal<string>('');

  // Paginador real (numero de pagina, salto directo) -- solo para una fecha
  // pasada (foto fija con total conocido). "Hoy" es en vivo via SSE, sin
  // paginador, como ya funcionaba.
  readonly pageSize = 50;
  pageIndex = signal(0);
  totalElements = signal(0);
  isViewingToday = computed(() => this.availableDates().find(d => d.value === this.selectedDate())?.isToday ?? true);

  searchControl = new FormControl('');
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  filteredDataSource = computed(() => {
    const term = (this.searchTerm() || '').trim().toUpperCase();
    if (!term) return this.dataSource();
    return this.dataSource().filter(row => row.symbol?.toUpperCase().includes(term));
  });

  ngOnInit(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    this.loading.set(true);

    const localeToday = this._localToday();
    this.logApi.getFechasSenial(scannerId).subscribe({
      next: (fechas: string[]) => {
        const dates: DateOption[] = [
          { value: localeToday, isToday: true },
          ...fechas
            .filter(f => f !== localeToday)
            .sort((a, b) => b.localeCompare(a))
            .map(f => ({ value: f, isToday: false }))
        ];
        this.availableDates.set(dates);
        this.selectedDate.set(localeToday);
        this._loadForDate(localeToday);
      },
      error: () => {
        this.availableDates.set([{ value: localeToday, isToday: true }]);
        this.selectedDate.set(localeToday);
        this._loadForDate(localeToday);
      }
    });
  }

  onDateChange(fecha: string): void {
    this.selectedDate.set(fecha);
    this.pageIndex.set(0);
    this.loading.set(true);
    this._loadForDate(fecha);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.loading.set(true);
    this._loadForDate(this.selectedDate());
  }

  private _loadForDate(fecha: string): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    const localeToday = this._localToday();
    if (fecha === localeToday) {
      this.dataStore.loadSignals(scannerId, (signals) => {
        this.dataSource.set(signals);
        this.loading.set(false);
      });
      return;
    }
    this.dataStore.loadSignalsForDate(scannerId, fecha, this.pageIndex(), this.pageSize, (signals, totalElements) => {
      this.dataSource.set(signals);
      this.totalElements.set(totalElements);
      this.loading.set(false);
    });
  }

  private _localToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const locale = this.i18n.currentLocale() === 'en' ? 'en-US' : 'es-CO';
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  }

  onViewDetails(signal: SignalRow): void {
    const { precio, matches } = this.parseMetadatos(signal.metadatos);
    const isMobile = window.innerWidth <= 768;
    this.dialog.open(SymbolDetailsComponent, {
      data: { symbol: signal.symbol, mensaje: signal.mensaje, buyPrice: precio, signalMatches: matches, scannerName: this.scanner().nombre, generatedAt: signal.timestamp },
      width: isMobile ? '98vw' : '90vw',
      maxWidth: isMobile ? '98vw' : '900px',
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
