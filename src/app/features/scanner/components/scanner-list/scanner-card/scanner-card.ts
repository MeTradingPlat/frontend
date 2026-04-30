import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Escaner } from '../../../models/escaner.interface';
import { DialogScannerExpand } from './scanner-dialog/dialog-scanner-expand';
import { MatDialog } from '@angular/material/dialog';
import { ScannerSignalsTab } from '../scanner-card-tabs/scanner-signals-tab/scanner-signals-tab';
import { ScannerAssetsTab } from '../scanner-card-tabs/scanner-assets-tab/scanner-assets-tab';
import { ScannerNewsTab } from '../scanner-card-tabs/scanner-news-tab/scanner-news-tab';
import { ScannerRegistryTab } from '../scanner-card-tabs/scanner-registry-tab/scanner-registry-tab';
import { ScannerFiltersTab } from '../scanner-card-tabs/scanner-filters-tab/scanner-filters-tab';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificacionSseService } from '../../../services/notificacion-sse.service';
import { AuthService } from '../../../../../core/auth/auth.service';


@Component({
  selector: 'app-scanner-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    TranslatePipe,
    RouterLink,
    MatDialogModule,
    MatIconModule,
    ScannerSignalsTab,
    ScannerAssetsTab,
    ScannerNewsTab,
    ScannerRegistryTab,
    ScannerFiltersTab
  ],
  templateUrl: './scanner-card.html',
  styleUrl: './scanner-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerCardComponent implements OnInit, OnDestroy {
  scanner = input.required<Escaner>();

  editScanner = output<number>();
  toggleScannerStatus = output<number>();
  viewScannerDetails = output<Escaner>();

  /** Contador de señales nuevas no vistas. Se resetea al abrir la pestaña de señales. */
  conteoSenalesNoLeidas = signal(0);

  private tabActivaIndex = 0;
  private readonly dialog = inject(MatDialog);
  private readonly sseService = inject(NotificacionSseService);
  readonly authService = inject(AuthService);
  private sseSub?: Subscription;

  ngOnInit(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) return;

    // Escucha el subject compartido sin abrir una nueva conexión SSE.
    // La conexión la establece el padre (ScannerList) con conectar().
    this.sseSub = this.sseService.notificaciones$.pipe(
      filter(n => n.idEscaner === scannerId && n.categoria === 'SIGNAL')
    ).subscribe(() => {
      // Solo incrementar si el usuario NO está viendo la pestaña de señales
      if (this.tabActivaIndex !== 0) {
        this.conteoSenalesNoLeidas.update(c => c + 1);
      }
    });
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  onTabChange(index: number): void {
    this.tabActivaIndex = index;
    if (index === 0) {
      this.conteoSenalesNoLeidas.set(0);
    }
  }

  openScannerDialog(scanner: Escaner): void {
    this.dialog.open(DialogScannerExpand, {
      width: '90vw',
      maxWidth: '1400px',
      height: window.innerWidth <= 768 ? '80vh' : '90vh',
      data: scanner,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
      panelClass: 'scanner-dialog-panel',
      autoFocus: false
    });
  }
}
