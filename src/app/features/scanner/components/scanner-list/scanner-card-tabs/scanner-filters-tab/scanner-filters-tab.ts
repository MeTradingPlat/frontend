import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { Filtro } from '../../../../models/filtro.interface';
import { ScannerFacadeService } from '../../../../services/scanner-facade.service';
import { formatFilterParameters, FilterParamView } from '../../../../utils/format-filter-parameter.util';
import { getCategoryFilterIcon } from '../../../../utils/category-filter-icon.util';
import { getFilterTypeIcon } from '../../../../utils/filter-type-icon.util';
import { I18nService } from '../../../../../../core/services/i18n/i18n.service';

interface FilterRow {
  nombre: string;
  categoriaEtiqueta: string;
  categoriaIcon: string;
  enumTipoFiltro: string;
  tipoEtiqueta: string;
  tipoIcon: string;
  parametros: FilterParamView[];
}

interface FilterSection {
  enumTipoFiltro: string;
  tipoEtiqueta: string;
  tipoIcon: string;
  filas: FilterRow[];
}

// Estaticos primero (se evaluan una sola vez), luego dinamicos, luego
// tecnicos (necesitan velas) -- refleja el orden real en que un escaner
// va reduciendo el universo de simbolos.
const ORDEN_TIPOS = ['ESTATICO', 'DINAMICO', 'TECNICO'];

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
export class ScannerFiltersTab {
  private readonly facade = inject(ScannerFacadeService);
  private readonly i18n = inject(I18nService);

  scanner = input.required<Escaner>();

  dataSource = signal<FilterRow[]>([]);
  loading = signal<boolean>(false);

  secciones = computed<FilterSection[]>(() => {
    const filas = this.dataSource();
    return ORDEN_TIPOS
      .map(tipo => {
        const filasTipo = filas.filter(f => f.enumTipoFiltro === tipo);
        const primera = filasTipo[0];
        return {
          enumTipoFiltro: tipo,
          tipoEtiqueta: primera?.tipoEtiqueta || '',
          tipoIcon: primera?.tipoIcon || getFilterTypeIcon(tipo),
          filas: filasTipo
        };
      })
      .filter(seccion => seccion.filas.length > 0);
  });

  constructor() {
    // Las etiquetas de filtro/categoria las traduce el backend segun el
    // header Accept-Language al momento de la peticion (no ngx-translate) --
    // sin esto, cambiar de idioma no refrescaba lo ya cargado en esta pestana.
    effect(() => {
      this.i18n.currentLocale();
      this.loadFilters();
    });
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
      enumTipoFiltro: filtro.enumTipoFiltro || '',
      tipoEtiqueta: filtro.etiquetaTipoFiltro || '',
      tipoIcon: getFilterTypeIcon(filtro.enumTipoFiltro),
      parametros: formatFilterParameters(filtro)
    };
  }
}
