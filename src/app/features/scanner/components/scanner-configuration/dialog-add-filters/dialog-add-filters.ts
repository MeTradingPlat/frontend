import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ScannerFacadeService } from '../../../services/scanner-facade.service';
import { Categoria } from '../../../models/categoria.interface';
import { Filtro } from '../../../models/filtro.interface';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dialog-add-filters',
  imports: [
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './dialog-add-filters.html',
  styleUrl: './dialog-add-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAddFilters {
  readonly dialogRef = inject(MatDialogRef<DialogAddFilters>);
  readonly data: { excludedFilters?: string[] } = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  private readonly facade = inject(ScannerFacadeService);

  // Signals para el estado
  categories = signal<Categoria[]>([]);
  filters = signal<Filtro[]>([]);
  selectedCategory = signal<string>('TODOS');
  searchControl = new FormControl('');
  searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  // Filtros filtrados por búsqueda y excluyendo los ya seleccionados
  filteredFilters = computed(() => {
    const search = this.searchTerm()?.toLowerCase() || '';
    const excludedFilters = this.data.excludedFilters || [];

    let filtered = this.filters();

    // Excluir filtros ya seleccionados
    filtered = filtered.filter(filtro => !excludedFilters.includes(filtro.enumFiltro));

    // Filtrar por búsqueda
    if (search) {
      filtered = filtered.filter(filtro =>
        filtro.etiquetaNombre?.toLowerCase().includes(search) ||
        filtro.etiquetaDescripcion?.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  constructor() {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.facade.loadCategoriasFiltros().subscribe({
      next: (categorias) => {
        this.categories.set(categorias);
        // Cargar filtros de la categoría por defecto (TODOS)
        this.loadFiltersByCategory('TODOS');
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  onCategorySelected(category: Categoria): void {
    this.selectedCategory.set(category.enumCategoriaFiltro);
    this.loadFiltersByCategory(category.enumCategoriaFiltro);
  }

  private loadFiltersByCategory(categoria: string): void {
    this.facade.getFiltrosPorCategoria(categoria).subscribe({
      next: (filtros) => {
        this.filters.set(filtros);
      },
      error: (err) => {
        console.error('Error al cargar filtros:', err);
      }
    });
  }

  onFilterAdded(filtro: Filtro): void {
    this.dialogRef.close(filtro.enumFiltro);
  }
}
