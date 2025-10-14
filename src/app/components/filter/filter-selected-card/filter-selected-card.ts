import { Component, ChangeDetectionStrategy, input, effect, EventEmitter, Output } from '@angular/core'; // Import Output
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltroDtoRespuesta } from '../../../models/filtro.model';
import { EnumParametro } from '../../../enums/enum-parametro';
import { EnumTipoValor } from '../../../enums/enum-tipo-valor';
import { FilterParameterConditional } from '../filter-parameter-conditional/filter-parameter-conditional';
import { FilterParameterOptions } from '../filter-parameter-options/filter-parameter-options';
import { FilterParameterNumber } from '../filter-parameter-number/filter-parameter-number';
import { ParametroDTORespuesta } from '../../../models/parametro.model';

@Component({
  selector: 'app-filter-selected-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterParameterConditional,
    FilterParameterOptions,
    FilterParameterNumber
  ],
  templateUrl: './filter-selected-card.html',
  styleUrl: './filter-selected-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterSelectedCard {
  filtro = input<FiltroDtoRespuesta | undefined>(undefined);
  @Output() filtroChange = new EventEmitter<FiltroDtoRespuesta>(); // Changed to @Output() EventEmitter
  submitted = input<boolean>(false);

  readonly EnumParametro = EnumParametro;
  readonly EnumTipoValor = EnumTipoValor;

  constructor() {
    // The effect was removed as it was not performing any synchronization logic
    // and the synchronization is handled by the child components and their ControlValueAccessor implementations.
  }

  get filterName(): string {
    return this.filtro()?.etiquetaNombre || $localize`Filtro Seleccionado`;
  }

  get filterCategory(): string {
    return this.filtro()?.objCategoria?.etiqueta || $localize`Categoría`;
  }

  onRemoveFilter(): void {
    console.log('Remover filtro seleccionado');
    // TODO: Implement actual removal logic and emit an event to the parent (CardFilter)
  }

  onParameterChange(updatedParametro: ParametroDTORespuesta, index: number): void {
    const currentFiltro = this.filtro();
    if (currentFiltro) {
      const newParametros = [...currentFiltro.parametros];
      newParametros[index] = updatedParametro;
      const updatedFiltro = { ...currentFiltro, parametros: newParametros };
      this.filtroChange.emit(updatedFiltro);
    }
  }

  trackByParametro(index: number, parametro: ParametroDTORespuesta): string {
    const uniquePart = parametro.enumParametro;
    return `${uniquePart}-${index}`;
  }
}
