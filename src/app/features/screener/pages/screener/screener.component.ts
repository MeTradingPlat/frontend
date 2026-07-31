import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ScreenerService } from '../../services/screener.service';
import { Market, Symbol } from '../../models/screener.models';
import { SymbolDetailsComponent } from '../../components/symbol-details/symbol-details.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
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
import { TranslateModule } from '@ngx-translate/core';
import { MarketLabelPipe } from '../../pipes/market-label.pipe';

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
    MarketLabelPipe
  ],
  templateUrl: './screener.component.html',
  styleUrls: ['./screener.component.scss']
})
export class ScreenerComponent implements OnInit {
  private screenerService = inject(ScreenerService);
  private dialog = inject(MatDialog);

  markets = signal<Market[]>([]);
  symbols = signal<Symbol[]>([]);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(false);
  pageIndex = signal<number>(0);
  readonly pageSize = PAGE_SIZE;

  searchControl = new FormControl('');
  marketControl = new FormControl<string[]>([]);

  displayedColumns: string[] = ['symbol', 'description', 'market', 'actions'];

  ngOnInit(): void {
    this.loadMarkets();

    combineLatest([
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
      this.marketControl.valueChanges,
    ]).subscribe(() => {
      this.pageIndex.set(0);
      this.search();
    });

    this.search();
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
    this.search();
  }

  search(): void {
    const query = this.searchControl.value || '';
    const selectedMarkets = this.marketControl.value || [];

    this.isLoading.set(true);
    this.screenerService.searchSymbols(query, selectedMarkets, this.pageIndex(), this.pageSize).subscribe({
      next: (res) => {
        this.symbols.set(res.data);
        this.totalElements.set(res.totalElements);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  viewDetails(symbol: string): void {
    this.dialog.open(SymbolDetailsComponent, {
      data: { symbol },
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'premium-dialog'
    });
  }
}
