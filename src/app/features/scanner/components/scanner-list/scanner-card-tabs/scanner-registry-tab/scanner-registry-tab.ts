import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
    MatPaginatorModule,
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
export class ScannerRegistryTab implements OnInit, OnDestroy {
  private readonly logApiService = inject(LogApiService);
  private readonly dataStore = inject(ScannerDataStore);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['timestamp', 'nivel', 'categoria', 'mensaje'];
  dataSource = signal<RegistroLog[]>([]);
  loading = signal<boolean>(false);
  availableDates = signal<DateOption[]>([]);
  selectedDate = signal<string>('');

  // Paginador real (50 por pagina, salto directo) para cualquier fecha,
  // incluido "hoy" -- ver loadRegistryLive en ScannerDataStore, mismo patron
  // que la pestana de Senales.
  readonly pageSize = 50;
  pageIndex = signal(0);
  totalElements = signal(0);

  searchControl = new FormControl('');
  // Mismo patron que scanner-signals-tab: con termino activo, _loadForDate
  // ignora la fecha seleccionada y busca en TODO el historial via
  // ScannerDataStore.searchRegistry (no solo la pagina ya cargada).
  private readonly searchTerm = signal('');

  // Minutos con su grupo de señales expandido ("ver mas") -- por clave de
  // minuto (no por fila), asi que sigue expandido aunque lleguen mas logs y
  // el array se reordene con onUpdate().
  private readonly expandedMinutes = signal<ReadonlySet<string>>(new Set());
  groupedDataSource = computed<GroupedRegistroLog[]>(() => groupSignalLogs(this.dataSource(), this.expandedMinutes()));

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      map(v => (v || '').trim().toUpperCase()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.pageIndex.set(0);
      this.loading.set(true);
      this._loadForDate(this.selectedDate());
    });

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
    const onResult = (logs: RegistroLog[], totalElements: number): void => {
      this.dataSource.set(logs);
      this.totalElements.set(totalElements);
      this.loading.set(false);
    };
    const term = this.searchTerm();
    if (term) {
      this.dataStore.searchRegistry(scannerId, this.logApiService, term, this.pageIndex(), this.pageSize, onResult);
      return;
    }
    if (fecha === this._localToday()) {
      this.dataStore.loadRegistryLive(scannerId, this.logApiService, fecha, this.pageIndex(), this.pageSize, onResult);
      return;
    }
    this.dataStore.loadLogsForDate(scannerId, this.logApiService, fecha, this.pageIndex(), this.pageSize, onResult);
  }

  ngOnDestroy(): void {
    const scannerId = this.scanner().idEscaner;
    if (scannerId) this.dataStore.releaseLiveRegistry(scannerId);
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
