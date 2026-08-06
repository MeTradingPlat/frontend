import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { Filtro } from '../../../../models/filtro.interface';
import { ScannerFacadeService } from '../../../../services/scanner-facade.service';
import { formatFilterParameters, FilterParamView } from '../../../../utils/format-filter-parameter.util';
import { getCategoryFilterIcon, getCategoryFilterClass } from '../../../../utils/category-filter-icon.util';

interface FilterRow {
  nombre: string;
  categoriaEtiqueta: string;
  categoriaIcon: string;
  categoriaClass: string;
  parametros: FilterParamView[];
}

@Component({
  selector: 'app-scanner-filters-tab',
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './scanner-filters-tab.html',
  styleUrl: './scanner-filters-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerFiltersTab implements OnInit {
  private readonly facade = inject(ScannerFacadeService);

  scanner = input.required<Escaner>();

  dataSource = signal<FilterRow[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadFilters();
  }

  loadFilters(): void {
    const scannerId = this.scanner().idEscaner;
    if (!scannerId) {
      return;
    }

    this.loading.set(true);

    this.facade.loadFiltrosEscanerSilent(scannerId).subscribe({
      next: (filtros: Filtro[]) => {
        const rows: FilterRow[] = filtros.map(filtro => this.toRow(filtro));
        this.dataSource.set(rows);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading filters:', error);
        this.dataSource.set([]);
        this.loading.set(false);
      }
    });
  }

  private toRow(filtro: Filtro): FilterRow {
    const enumCategoria = filtro.objCategoria?.enumCategoriaFiltro || '';
    return {
      nombre: filtro.etiquetaNombre || '',
      categoriaEtiqueta: filtro.objCategoria?.etiqueta || '',
      categoriaIcon: getCategoryFilterIcon(enumCategoria),
      categoriaClass: getCategoryFilterClass(enumCategoria),
      parametros: formatFilterParameters(filtro)
    };
  }
}
