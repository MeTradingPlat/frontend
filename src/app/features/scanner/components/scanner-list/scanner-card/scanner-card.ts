import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../models/escaner.interface';
import { DialogScannerExpand } from './scanner-dialog/dialog-scanner-expand';
import { MatDialog } from '@angular/material/dialog';
import { ScannerSignalsTab } from '../scanner-card-tabs/scanner-signals-tab/scanner-signals-tab';
import { ScannerAssetsTab } from '../scanner-card-tabs/scanner-assets-tab/scanner-assets-tab';
import { ScannerNewsTab } from '../scanner-card-tabs/scanner-news-tab/scanner-news-tab';
import { ScannerRegistryTab } from '../scanner-card-tabs/scanner-registry-tab/scanner-registry-tab';
import { ScannerFiltersTab } from '../scanner-card-tabs/scanner-filters-tab/scanner-filters-tab';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-scanner-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
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
export class ScannerCardComponent {
  scanner = input.required<Escaner>();

  // Outputs para acciones que el padre (ScannerList) podría manejar
  editScanner = output<number>();
  toggleScannerStatus = output<number>();
  viewScannerDetails = output<Escaner>();

  private readonly dialog = inject(MatDialog);

  openScannerDialog(scanner: Escaner): void {
    this.dialog.open(DialogScannerExpand, {
      width: '90vw',
      maxWidth: '1400px',
      height: '90vh',
      data: scanner,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
      panelClass: 'scanner-dialog-panel'
    });
  }
}
