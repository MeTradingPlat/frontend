import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ScreenerService } from '../../services/screener.service';
import { Market, SymbolSummary } from '../../models/screener.models';
import { SymbolDetailsComponent } from '../../components/symbol-details/symbol-details.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
import { TranslateModule } from '@ngx-translate/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

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
    TranslateModule,
    ScrollingModule
  ],
  templateUrl: './screener.component.html',
  styleUrls: ['./screener.component.scss']
})
export class ScreenerComponent implements OnInit {
  private screenerService = inject(ScreenerService);
  private dialog = inject(MatDialog);

  markets = signal<Market[]>([]);
  allSymbols = signal<SymbolSummary[]>([]);
  filteredSymbols = signal<SymbolSummary[]>([]);
  isLoading = signal<boolean>(false);

  searchControl = new FormControl('');
  marketControl = new FormControl<string[]>([]);

  displayedColumns: string[] = ['symbol', 'description', 'listedMarket', 'actions'];

  ngOnInit(): void {
    this.loadMarkets();
    this.loadSymbols();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.applyFilters());

    this.marketControl.valueChanges.subscribe(() => this.applyFilters());
  }

  loadMarkets(): void {
    this.screenerService.getMarkets().subscribe(m => this.markets.set(m));
  }

  loadSymbols(): void {
    this.isLoading.set(true);
    this.screenerService.getSymbols().subscribe({
      next: (s) => {
        this.allSymbols.set(s);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  applyFilters(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    const selectedMarkets = this.marketControl.value || [];

    let filtered = this.allSymbols();

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.symbol.toLowerCase().includes(searchTerm) || 
        s.description.toLowerCase().includes(searchTerm)
      );
    }

    if (selectedMarkets.length > 0) {
      const selectedSet = new Set(selectedMarkets.map(m => m.toLowerCase()));
      filtered = filtered.filter(s => {
        if (!s.listedMarket) return false;
        return selectedSet.has(s.listedMarket.toLowerCase());
      });
    }

    this.filteredSymbols.set(filtered);
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
