import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiltroDtoRespuesta } from '../../../models/filtro.model';
import { FiltroService } from '../../../services/filtro.service';
import { EnumFiltro } from '../../../enums/enum-filtro';

@Component({
  selector: 'app-filter-add-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-add-card.html',
  styleUrl: './filter-add-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterAddCard {
  filter = input<FiltroDtoRespuesta>();
  filterAdded = output<FiltroDtoRespuesta>();

  private filtroService = inject(FiltroService);

  addFilterTitle = $localize`Agregar nuevo filtro`;

  onAddFilter(): void {
    if (this.filter()?.enumFiltro) {
      this.filtroService.getDefaultFiltro(this.filter()!.enumFiltro).subscribe({
        next: (defaultFiltro) => {
          this.filterAdded.emit(defaultFiltro);
        },
        error: (err) => {
          
        }
      });
    }
  }
}