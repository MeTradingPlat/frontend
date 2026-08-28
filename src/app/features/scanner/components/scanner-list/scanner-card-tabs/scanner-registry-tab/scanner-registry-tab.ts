import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { LogApiService } from '../../../../services/log-api.service';
import { ScannerDataStore } from '../../../../services/scanner-data-store.service';
import { RegistroLog } from '../../../../models/registro-log.interface';
import { MarketDatetimePipe } from '../../../../../../shared/pipes/market-datetime.pipe';
import { parseLogEvent, ParsedSignalEvent, ParsedScannerEvent } from '../../../../utils/parse-log-event.util';
import { groupSignalLogs, GroupedRegistroLog } from '../../../../utils/group-signal-logs.util';
import { I18nService } from '../../../../../../core/services/i18n/i18n.service';

interface DateOption {
  value: string;
  isToday: boolean;
}

@Component({
  selector: 'app-scanner-registry-tab',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    TranslatePipe,
    MarketDatetimePipe
  ],
  templateUrl: './scanner-registry-tab.html',
  styleUrl: './scanner-registry-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerRegistryTab implements OnInit {
  private readonly logApiService = inject(LogApiService);
  private readonly dataStore = inject(ScannerDataStore);
  private readonly i18n = inject(I18nService);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['timestamp', 'nivel', 'categoria', 'mensaje'];
  dataSource = signal<RegistroLog[]>([]);
  loading = signal<boolean>(false);
  hasMore = signal<boolean>(false);
  availableDates = signal<DateOption[]>([]);
  selectedDate = signal<string>('');
  private loadMoreFn?: () => void;

  searchControl = new FormControl('');
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  filteredDataSource = computed(() => {
    const term = (this.searchTerm() || '').trim().toUpperCase();
    if (!term) return this.dataSource();
    return this.dataSource().filter(row => row.symbol?.toUpperCase().includes(term));
  });

  // Minutos con su grupo de señales expandido ("ver mas") -- por clave de
  // minuto (no por fila), asi que sigue expandido aunque lleguen mas logs y
  // el array se reordene con onUpdate().
  private readonly expandedMinutes = signal<ReadonlySet<string>>(new Set());
  groupedDataSource = computed<GroupedRegistroLog[]>(() => groupSignalLogs(this.filteredDataSource(), this.expandedMinutes()));

  ngOnInit(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    this.loading.set(true);

    const localeToday = this._localToday();
    this.logApiService.getFechasRegistro(scannerId).subscribe({
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
        this._loadForDate(undefined);
      },
      error: () => {
        this.availableDates.set([{ value: localeToday, isToday: true }]);
        this.selectedDate.set(localeToday);
        this._loadForDate(undefined);
      }
    });
  }

  onDateChange(fecha: string): void {
    this.selectedDate.set(fecha);
    this.loading.set(true);
    const localeToday = this._localToday();
    this._loadForDate(fecha !== localeToday ? fecha : undefined);
  }

  private _loadForDate(fecha?: string): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;
    const { loadMore } = this.dataStore.loadLogs(scannerId, this.logApiService, (logs, more) => {
      this.dataSource.set(logs);
      this.hasMore.set(more);
      this.loading.set(false);
    }, fecha);
    this.loadMoreFn = loadMore;
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

  onLoadMore(): void {
    this.loadMoreFn?.();
  }

  toggleMinuteGroup(minuteKey: string | undefined): void {
    if (!minuteKey) return;
    this.expandedMinutes.update(current => {
      const next = new Set(current);
      if (next.has(minuteKey)) next.delete(minuteKey); else next.add(minuteKey);
      return next;
    });
  }

  parseEvent(row: RegistroLog): ParsedSignalEvent | ParsedScannerEvent | null {
    return parseLogEvent(row.categoria, row.metadatos);
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

}
