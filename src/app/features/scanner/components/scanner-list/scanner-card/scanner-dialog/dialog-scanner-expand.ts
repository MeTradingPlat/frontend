import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ScannerSignalsTab } from "../../scanner-card-tabs/scanner-signals-tab/scanner-signals-tab";
import { ScannerAssetsTab } from "../../scanner-card-tabs/scanner-assets-tab/scanner-assets-tab";
import { ScannerNewsTab } from "../../scanner-card-tabs/scanner-news-tab/scanner-news-tab";
import { ScannerRegistryTab } from "../../scanner-card-tabs/scanner-registry-tab/scanner-registry-tab";
import { ScannerFiltersTab } from "../../scanner-card-tabs/scanner-filters-tab/scanner-filters-tab";
import { Escaner } from '../../../../models/escaner.interface';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScannerApiService } from '../../../../services/scanner-api.service';
import { NotificationService } from '../../../../../../core/services/notification/notification.service';
import { ScannerFacadeService } from '../../../../services/scanner-facade.service';

@Component({
  selector: 'app-scanner-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    ScannerSignalsTab,
    ScannerAssetsTab,
    ScannerNewsTab,
    ScannerRegistryTab,
    ScannerFiltersTab
  ],
  template: `
    <mat-dialog-content>
    <mat-card appearance="outlined" class="dialog-scanner-card">
      <mat-card-header>
        <mat-card-title>{{ scanner.nombre }}</mat-card-title>
        <div class="header-icons">
          <i
            class="bi bi-gear-fill"
            role="button"
            (click)="onConfigureScanner()"
            [matTooltip]="'SCANNER.CONFIGURE' | translate: {id: scanner.idEscaner}"
          ></i>

          @if (scanner.objEstado?.enumEstadoEscaner === 'INICIADO') {
            <div class="button-with-spinner">
              <mat-progress-spinner mode="indeterminate" diameter="24" strokeWidth="2"></mat-progress-spinner>
              <i
                class="bi bi-stop-fill"
                role="button"
                (click)="onToggleScannerStatus()"
                [matTooltip]="'SCANNER.STOP' | translate: {id: scanner.idEscaner}"
              ></i>
            </div>
          } @else {
            <i
              class="bi bi-play-fill"
              role="button"
              (click)="onToggleScannerStatus()"
              [matTooltip]="'SCANNER.START' | translate: {id: scanner.idEscaner}"
            ></i>
          }

          <i
            mat-dialog-close
            class="bi bi-x-circle-fill"
            role="button"
            [matTooltip]="'SCANNER.CLOSE' | translate"
          ></i>
        </div>
      </mat-card-header>

      <mat-tab-group headerPosition="below">
        <mat-tab [label]="'SCANNER.SIGNALS' | translate">
          <ng-template matTabContent>
            <div class="tab-content">
              <app-scanner-signals-tab [scanner]="scanner" />
            </div>
          </ng-template>
        </mat-tab>
        <mat-tab [label]="'SCANNER.ASSETS' | translate">
          <ng-template matTabContent>
            <div class="tab-content">
              <app-scanner-assets-tab [scanner]="scanner" />
            </div>
          </ng-template>
        </mat-tab>
        <mat-tab [label]="'NEWS.NEWS' | translate">
          <ng-template matTabContent>
            <div class="tab-content">
              <app-scanner-news-tab [scanner]="scanner" />
            </div>
          </ng-template>
        </mat-tab>
        <mat-tab [label]="'SCANNER.REGISTRY' | translate">
          <ng-template matTabContent>
            <div class="tab-content">
              <app-scanner-registry-tab [scanner]="scanner" />
            </div>
          </ng-template>
        </mat-tab>
        <mat-tab [label]="'SCANNER.FILTERS' | translate">
          <ng-template matTabContent>
            <div class="tab-content">
              <app-scanner-filters-tab [scanner]="scanner" />
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
    </mat-card>
  </mat-dialog-content>
  `,
  styles: [`
    mat-dialog-content {
      padding: 0 !important;
      max-height: none !important;
    }
    
    .dialog-scanner-card {
      height: 90vh;
      max-height: none;
      display: flex;
      flex-direction: column;
      border: none;
      border-radius: 0;
      overflow: visible;
      
      .mat-mdc-card-header {
        display: flex;
        box-sizing: border-box;
        justify-content: space-between;
        background-color: var(--mat-sys-primary);
        gap: 20px;
        width: 100%;
        flex-shrink: 0;
        border-radius: 0;
      }
      
      .mat-mdc-card-title {
        color: var(--mat-sys-on-primary);
      }
      
      .header-icons {
        width: auto;
        display: flex;
        color: var(--mat-sys-on-primary);
        gap: 10px;
        align-items: center;

        .button-with-spinner {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;

          mat-progress-spinner {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
            z-index: 0;
            transform: scale(1.3);

            ::ng-deep circle {
              stroke: var(--mat-sys-on-primary) !important;
            }
          }

          i {
            position: relative;
            z-index: 1;
          }
        }

        i {
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }
      }
      
      mat-tab-group {
        background-color: var(--mat-sys-surface-container-low);
        width: 100%;
        height: 100%;
        flex: 1;
        display: flex;
        border-radius: 0;
        overflow: hidden;
      }
      
      ::ng-deep {
        .mat-mdc-tab-body-wrapper {
          flex: 1;
          height: 100%;
        }

        .mat-mdc-tab-body {
          height: 100%;
        }

        .mat-mdc-tab-body-content {
          height: 100%;
          overflow: auto;
        }
      }
    }
    
    .tab-content {
      height: 100%;
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogScannerExpand {
  readonly dialogRef = inject(MatDialogRef<DialogScannerExpand>);
  readonly scanner: Escaner = inject(MAT_DIALOG_DATA);
  private readonly router = inject(Router);
  private readonly scannerApi = inject(ScannerApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly facade = inject(ScannerFacadeService);

  onConfigureScanner(): void {
    // Cerrar el diálogo antes de navegar
    this.dialogRef.close();
    // Navegar a la configuración
    this.router.navigate(['/escaneres/configuracion', this.scanner.idEscaner]);
  }

  onToggleScannerStatus(): void {
    const isRunning = this.scanner.objEstado?.enumEstadoEscaner === 'INICIADO';

    const action$ = isRunning
      ? this.scannerApi.detenerEscaner(this.scanner.idEscaner!)
      : this.scannerApi.iniciarEscaner(this.scanner.idEscaner!);

    action$.subscribe({
      next: () => {
        const message = isRunning
          ? `${this.translate.instant('SCANNER.STOPPED_SUCCESS').replace('{{name}}', this.scanner.nombre).replace('"{{name}}"', `"${this.scanner.nombre}"`)}`
          : `${this.translate.instant('SCANNER.STARTED_SUCCESS').replace('{{name}}', this.scanner.nombre).replace('"{{name}}"', `"${this.scanner.nombre}"`)}`;
        this.notificationService.showSuccess(message);

        // Cerrar el diálogo y recargar la lista
        this.dialogRef.close();
        this.facade.loadEscaners(true).subscribe();
      },
      error: (err) => {
        const errorMessage = err?.error?.mensaje || err?.message || this.translate.instant('SCANNER.STATE_CHANGE_ERROR');
        this.notificationService.showError(errorMessage);
      }
    });
  }
}