import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScreenerService } from '../../services/screener.service';
import { SymbolDetails } from '../../models/screener.models';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { SymbolChartComponent } from '../symbol-chart/symbol-chart.component';
import { MarketLabelPipe } from '../../pipes/market-label.pipe';
import { Subscription, interval, startWith, switchMap, catchError, of } from 'rxjs';

// Los fundamentales del backend se actualizan en vivo por push de DxLink
// (FundamentalsConnectionPool) -- este polling es lo que hace que la UI
// tambien se sienta en tiempo real, sin necesitar un canal de push propio.
const POLL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-symbol-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTabsModule,
    TranslateModule,
    SymbolChartComponent,
    MarketLabelPipe
  ],
  templateUrl: './symbol-details.component.html',
  styleUrls: ['./symbol-details.component.scss']
})
export class SymbolDetailsComponent implements OnInit, OnDestroy {
  private screenerService = inject(ScreenerService);
  private dialogRef = inject(MatDialogRef<SymbolDetailsComponent>);
  data = inject(MAT_DIALOG_DATA);

  symbolDetails = signal<SymbolDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  private pollSubscription?: Subscription;

  ngOnInit(): void {
    this.pollSubscription = interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.screenerService.getSymbolDetails(this.data.symbol).pipe(
        catchError((err) => {
          console.error('Error loading symbol details:', err);
          this.error.set('No se pudo cargar la información fundamental del símbolo.');
          return of(null);
        })
      ))
    ).subscribe((details) => {
      if (details) {
        this.symbolDetails.set(details);
        this.error.set(null);
      }
      this.isLoading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  close(): void {
    this.dialogRef.close();
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    return value.toLocaleString();
  }
}
