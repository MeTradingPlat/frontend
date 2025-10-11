import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-add-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-add-card.html',
  styleUrl: './filter-add-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterAddCard {
  @Input() filterName: string = $localize`Filtro`;
  @Input() filterDescription: string = $localize`Descripción`;
  @Input() filterCategory: string = $localize`Categoría`;
  addFilterTitle = $localize`Agregar nuevo filtro`;

  onAddFilter(): void {
    console.log('Agregar nuevo filtro');
  }
}