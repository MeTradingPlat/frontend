import { Component, Input, ChangeDetectionStrategy, HostBinding, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumFiltro } from '../enums/enum-filtro';
import { FiltroService } from '../filtro';
import { FiltroDtoRespuesta } from '../models/filtro.model';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-filter-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-card.html',
  styleUrls: ['./filter-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterCard implements OnChanges {
  @Input() filtroEnum?: EnumFiltro;
  @Input() filtroData?: FiltroDtoRespuesta;

  filtroData$?: Observable<FiltroDtoRespuesta>;

  constructor(private filtroService: FiltroService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.filtroData) {
      this.filtroData$ = of(this.filtroData);
    } else if (this.filtroEnum !== undefined) { // Se activa si filtroEnum tiene un valor (inicial o cambiado)
      this.filtroData$ = this.filtroService.obtenerFiltroPorDefecto(this.filtroEnum);
    }
  }

  /** Clases/atributos útiles para accesibilidad y estilos desde el host */
  @HostBinding('class.filter-card') hostClass = true;
  @HostBinding('attr.role') role = 'group';
  @HostBinding('attr.aria-label') get ariaLabel() {
    // This can be improved later if needed, for example by binding to the filter name
    return 'Filter card';
  }
}