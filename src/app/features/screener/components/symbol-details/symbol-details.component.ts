import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScreenerService } from '../../services/screener.service';
import { SymbolDetails } from '../../models/screener.models';
import { SignalFilterMatch } from '../../models/candle.models';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { SymbolChartComponent } from '../symbol-chart/symbol-chart.component';
import { MarketLabelPipe } from '../../pipes/market-label.pipe';
import { Subscription, interval, startWith, switchMap, catchError, of } from 'rxjs';

// Mismo orden de temporalidades que el backend (ver _TIMEFRAME_MINUTES en
// signal-processing-service/app/scanner/timeframe.py) -- solo se usa aca para
// elegir cual chip mostrar como default (la mas fina) cuando una senal
// disparo en varias temporalidades a la vez.
const TIMEFRAME_MINUTES: Record<string, number> = {
  M1: 1, M2: 2, M3: 3, M5: 5, M10: 10, M15: 15, M30: 30, M45: 45,
  H1: 60, H2: 120, H3: 180, H4: 240, H12: 720,
  D1: 1440, D2: 2880, D3: 4320, W1: 10080,
  MO1: 43200, MO3: 129600, MO6: 259200, Y1: 525600
};

function dedupeByTimeframe(matches: SignalFilterMatch[]): SignalFilterMatch[] {
  const byTf = new Map<string, SignalFilterMatch>();
  for (const m of matches) if (!byTf.has(m.timeframe)) byTf.set(m.timeframe, m);
  return [...byTf.values()].sort((a, b) => (TIMEFRAME_MINUTES[a.timeframe] ?? 0) - (TIMEFRAME_MINUTES[b.timeframe] ?? 0));
}

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
    MatChipsModule,
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

  readonly timeframeOptions: SignalFilterMatch[] = dedupeByTimeframe(this.data.signalMatches ?? []);
  // Arranca en la temporalidad mas fina donde se disparo la senal (primera del
  // array ordenado por granularidad), con el marcador de vela activo desde el
  // inicio. Sin esto, el marcador no aparecia hasta que el usuario hacia clic
  // manualmente en un chip de timeframe -- confirmado: el usuario abria el
  // dialogo y no veia ninguna barra marcada.
  readonly activeTimeframe = signal<string>(this.timeframeOptions[0]?.timeframe ?? 'M1');
  readonly activeMatch = signal<SignalFilterMatch | undefined>(this.timeframeOptions[0] ?? undefined);

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

  selectTimeframe(match: SignalFilterMatch): void {
    this.activeMatch.set(match);
    this.activeTimeframe.set(match.timeframe);
  }

  // El backend manda velaTimestamp en UTC pero sin sufijo de zona horaria
  // (Python le quita el tzinfo antes de serializar) -- un ISO sin 'Z' ni
  // offset lo interpreta JS como hora LOCAL del navegador, no UTC. Sin este
  // ajuste, una vela de las 13:30 UTC se leia como 13:30 hora Colombia
  // (18:30 UTC real), cayendo fuera del rango de velas cargadas y
  // abortando el marcador silenciosamente por el guard de seguridad.
  markerTime(): number | undefined {
    const vela = this.activeMatch()?.velaTimestamp;
    if (!vela) return undefined;
    const utcIso = vela.endsWith('Z') ? vela : vela + 'Z';
    return Math.floor(new Date(utcIso).getTime() / 1000);
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    return value.toLocaleString();
  }
}
