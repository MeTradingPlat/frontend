import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ScreenerService } from '../../services/screener.service';
import { Market, Symbol } from '../../models/screener.models';
import { SymbolDetailsComponent } from '../../components/symbol-details/symbol-details.component';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { merge, of, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MarketLabelPipe } from '../../pipes/market-label.pipe';
import { HeaderNavbar } from '../../../../shared/components/layout/header-navbar/header-navbar';
import { I18nService } from '../../../../core/services/i18n/i18n.service';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-screener',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDividerModule,
    MatPaginatorModule,
    TranslateModule,
    MarketLabelPipe,
    HeaderNavbar
  ],
  templateUrl: './screener.component.html',
  styleUrls: ['./screener.component.scss']
})
export class ScreenerComponent implements OnInit {
  private screenerService = inject(ScreenerService);
  private dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly i18nService = inject(I18nService);

  readonly title = computed(() => {
    // Hacer que el computed dependa del idioma actual
    const currentLang = this.i18nService.currentLocale();
    return this.translate.instant('ASSETS.TITLE');
  });

  markets = signal<Market[]>([]);
  symbols = signal<Symbol[]>([]);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(false);
  pageIndex = signal<number>(0);
  readonly pageSize = PAGE_SIZE;

  searchControl = new FormControl('');
  marketControl = new FormControl<string[]>([]);

  displayedColumns: string[] = ['symbol', 'description', 'market', 'actions'];

  @ViewChild('viewport') private viewportRef?: ElementRef<HTMLDivElement>;

  private readonly searchTrigger$ = new Subject<void>();

  ngOnInit(): void {
    this.loadMarkets();

    // merge (no combineLatest): con combineLatest, si un lado nunca emite
    // (marketControl arranca con setValue({emitEvent:false}) para no disparar
    // una busqueda redundante al cargar) el otro lado tampoco dispara nunca --
    // asi quedaba bloqueada la busqueda por texto hasta tocar el filtro de
    // mercado. Con merge cualquiera de los dos dispara por su cuenta.
    merge(
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
      this.marketControl.valueChanges,
    ).subscribe(() => {
      this.pageIndex.set(0);
      this.searchTrigger$.next();
    });

    // switchMap: si el usuario escribe rapido, cancela la peticion anterior
    // en vuelo -- con un subscribe() suelto por busqueda, una respuesta vieja
    // que llega tarde podia pisar a una mas nueva y mostrar resultados que no
    // corresponden a lo que hay escrito ahora.
    this.searchTrigger$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => this.screenerService
        .searchSymbols(this.searchControl.value || '', this.marketControl.value || [], this.pageIndex(), this.pageSize)
        .pipe(catchError(() => of(null)))),
    ).subscribe(res => {
      this.isLoading.set(false);
      if (res) {
        // El backend garantiza data como array, pero un viejo cache/edge
        // podria traer null -- la tabla hace symbols().length, asi que
        // nunca se siembra la senal con null.
        this.symbols.set(res.data ?? []);
        this.totalElements.set(res.totalElements);
        // Sin esto, filtrar/buscar con el scroll de la tabla bajado dejaba
        // los resultados nuevos empezando a mitad de la vista en vez de
        // arriba del todo, donde el usuario esperaria verlos.
        if (this.viewportRef) this.viewportRef.nativeElement.scrollTop = 0;
      }
    });

    this.searchTrigger$.next();
  }

  loadMarkets(): void {
    this.screenerService.getMarkets().subscribe(m => {
      this.markets.set(m);
      // Todos los mercados vienen seleccionados por defecto -- antes arrancaba
      // vacio, que funcionalmente ya significaba "sin filtro" (ver search()),
      // pero visualmente parecia que no habia nada elegido.
      this.marketControl.setValue(m.map(market => market.id), { emitEvent: false });
    });
  }

  toggleAllMarkets(checked: boolean): void {
    if (checked) {
      this.marketControl.setValue(this.markets().map(m => m.id));
    } else {
      this.marketControl.setValue([]);
    }
  }

  isAllSelected(): boolean {
    const selected = this.marketControl.value || [];
    return this.markets().length > 0 && selected.length === this.markets().length;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.searchTrigger$.next();
  }

  viewDetails(symbol: string): void {
    const isMobile = window.innerWidth <= 768;
    this.dialog.open(SymbolDetailsComponent, {
      data: { symbol },
      // width en vw como medida principal (no un px fijo con vw solo de
      // tope) -- igual que dialog-scanner-expand, para que en movil ocupe
      // el mismo ancho proporcional que en escritorio en vez de quedar mas
      // angosto de lo esperado. En movil casi todo el ancho de pantalla,
      // no solo el 90% (poco margen util en una pantalla ya angosta).
      width: isMobile ? '98vw' : '90vw',
      maxWidth: isMobile ? '98vw' : '900px',
      maxHeight: '90vh',
      panelClass: 'premium-dialog'
    });
  }
}
