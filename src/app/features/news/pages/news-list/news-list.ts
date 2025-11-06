import { ChangeDetectionStrategy, Component, computed, OnInit, ViewChild, AfterViewInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HeaderNavbar } from "../../../../shared/components/layout/header-navbar/header-navbar";
import { I18nService } from '../../../../core/services/i18n/i18n.service';

interface NewsRow {
  fecha: string;
  noticia: string;
}

@Component({
  selector: 'app-news-list',
  imports: [
    CommonModule,
    HeaderNavbar,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './news-list.html',
  styleUrl: './news-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsList implements OnInit, AfterViewInit {
  private readonly translate = inject(TranslateService);
  private readonly i18nService = inject(I18nService);

  displayedColumns: string[] = ['fecha', 'noticia', 'details'];
  dataSource: MatTableDataSource<NewsRow> = new MatTableDataSource<NewsRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly title = computed(() => {
    // Hacer que el computed dependa del idioma actual
    const currentLang = this.i18nService.currentLocale();
    return this.translate.instant('NEWS.TITLE');
  });

  ngOnInit(): void {
    // TODO: Load news from backend when service is available
    this.dataSource.data = [];
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onViewDetails(row: NewsRow): void {
    // TODO: Implement view details functionality
    console.log('View details for news:', row);
  }
}
