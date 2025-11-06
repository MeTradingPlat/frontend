import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';
import { Filtro } from '../../../../models/filtro.interface';
import { ScannerFacadeService } from '../../../../services/scanner-facade.service';

interface FilterRow {
  nombre: string;
  categoria: string;
  parametros: string;
}

@Component({
  selector: 'app-scanner-filters-tab',
  imports: [
    CommonModule,
    MatTableModule,
    TranslatePipe
  ],
  templateUrl: './scanner-filters-tab.html',
  styleUrl: './scanner-filters-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerFiltersTab implements OnInit {
  private readonly facade = inject(ScannerFacadeService);

  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['nombre', 'categoria', 'parametros'];
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
        const rows: FilterRow[] = filtros.map(filtro => ({
          nombre: filtro.etiquetaNombre || 'Sin nombre',
          categoria: filtro.objCategoria?.etiqueta || '',
          parametros: this.formatParameters(filtro)
        }));
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

  private formatParameters(filtro: Filtro): string {
    if (!filtro.parametros || filtro.parametros.length === 0) {
      return 'Sin parámetros';
    }

    return filtro.parametros
      .map(param => {
        const valor = param.objValorSeleccionado;
        if (!valor) return `${param.etiqueta}: -`;

        switch (valor.enumTipoValor) {
          case 'INTEGER':
          case 'FLOAT':
            return `${param.etiqueta}: ${(valor as any).valor}`;
          case 'STRING':
            return `${param.etiqueta}: ${valor.etiqueta}`;
          case 'CONDICIONAL':
            const cond = valor as any;
            return `${param.etiqueta}: ${valor.etiqueta} ${cond.valor1}${cond.valor2 ? ` - ${cond.valor2}` : ''}`;
          default:
            return `${param.etiqueta}: ${valor.etiqueta}`;
        }
      })
      .join(', ');
  }
}
