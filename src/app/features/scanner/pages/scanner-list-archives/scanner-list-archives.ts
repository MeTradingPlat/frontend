import { ChangeDetectionStrategy, Component, computed, inject, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PageLoading } from '../../../../shared/components/ui/page-loading/page-loading';
import { HeaderNavbar } from "../../../../shared/components/layout/header-navbar/header-navbar";
import { PageError } from '../../../../shared/components/ui/page-error/page-error';
import { NavbarButton } from '../../../../shared/models/interface/navbar-button.interface';
import { Escaner } from '../../models/escaner.interface';
import { ScannerFacadeService } from '../../services/scanner-facade.service';
import { DialogScannerExpand } from '../../components/scanner-list/scanner-card/scanner-dialog/dialog-scanner-expand';
import { MatCardModule } from '@angular/material/card';
import { I18nService } from '../../../../core/services/i18n/i18n.service';
import { NotificacionSseService } from '../../services/notificacion-sse.service';
import { MetadatosEstadoEscaner } from '../../models/notificacion.interface';

interface ArchivedScannerRow {
  idEscaner: number;
  nombre: string;
  fechaCreacion: string;
  scanner: Escaner;
}

@Component({
  selector: 'app-scanner-list-archives',
  imports: [
    CommonModule,
    HeaderNavbar,
    PageLoading,
    PageError,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatCardModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './scanner-list-archives.html',
  styleUrl: './scanner-list-archives.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerListArchives implements OnInit, OnDestroy, AfterViewInit {
  private readonly facade = inject(ScannerFacadeService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly i18nService = inject(I18nService);
  private readonly notificacionSseService = inject(NotificacionSseService);

  // Estados que cambian que fila de esta lista debe existir -- ARCHIVADO la
  // agrega (o CREADO no aplica aca), DESARCHIVADO/ELIMINADO la quitan. Un
  // refresco completo es suficiente: esta lista es chica y se ve con poca
  // frecuencia comparada con la principal, no justifica parchear a mano.
  private static readonly ESTADOS_QUE_AFECTAN_ARCHIVADOS = new Set(['ARCHIVADO', 'DESARCHIVADO', 'ELIMINADO']);
  private sseSubscription?: Subscription;

  readonly loading = this.facade.loading;
  readonly error = this.facade.error;

  displayedColumns: string[] = ['nombre', 'fechaCreacion', 'actions'];
  dataSource: MatTableDataSource<ArchivedScannerRow> = new MatTableDataSource<ArchivedScannerRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly title = computed(() => {
    // Hacer que el computed dependa del idioma actual
    const currentLang = this.i18nService.currentLocale();
    return this.translate.instant('SCANNER.ARCHIVED_TITLE');
  });

  readonly backPath = "/escaneres"

  ngOnInit(): void {
    this.loadArchivedScanners();
    this.sseSubscription = this.notificacionSseService.conectar().subscribe(notificacion => {
      if (notificacion.tipo !== 'SCANNER_STATE' || !notificacion.metadatos) return;
      try {
        const metadatos: MetadatosEstadoEscaner = JSON.parse(notificacion.metadatos);
        if (ScannerListArchives.ESTADOS_QUE_AFECTAN_ARCHIVADOS.has(metadatos.estadoNuevo)) {
          this.loadArchivedScanners();
        }
      } catch (e) {
        console.error('Error parseando metadatos de estado:', e);
      }
    });
  }

  ngOnDestroy(): void {
    this.sseSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadArchivedScanners(): void {
    this.facade.loadArchivedEscaners(true).subscribe({
      next: (scanners) => {
        const rows: ArchivedScannerRow[] = scanners.map(scanner => ({
          idEscaner: scanner.idEscaner!,
          nombre: scanner.nombre,
          fechaCreacion: scanner.fechaCreacion || '',
          scanner: scanner
        }));
        this.dataSource.data = rows;
      },
      error: (error) => {
        console.error('Error loading archived scanners:', error);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  reloadPage(): void {
    this.loadArchivedScanners();
  }

  onConfigureScanner(id: number): void {
    this.router.navigate(['/escaneres/configuracion', id]);
  }

  onExpandScanner(scanner: Escaner): void {
    this.dialog.open(DialogScannerExpand, {
      // 90vw en movil queda mas angosto que la propia card sin ampliar (ver
      // scanner-card.ts::openScannerDialog) -- calc(100vw - 40px) iguala el
      // padding real de scanner-list-archives.scss (.page-content: 20px).
      width: window.innerWidth <= 768 ? 'calc(100vw - 40px)' : '90vw',
      maxWidth: '1400px',
      height: window.innerWidth <= 768 ? '80vh' : '90vh',
      data: scanner,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
      panelClass: 'scanner-dialog-panel'
    });
  }
}
