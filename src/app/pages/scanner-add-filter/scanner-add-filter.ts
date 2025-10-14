import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; // Agregar estas importaciones
import { LoadPage } from "../../components/page-state/load-page/load-page";
import { LoadPageError } from "../../components/page-state/load-page-error/load-page-error";
import { FiltroService } from '../../services/filtro.service';
import { NavbarAux } from "../../components/navbar/navbar-aux/navbar-aux";
import { LanguageService } from '../../services/language.service';
import { FilterButton } from '../../components/scanner/add-filter/filter-button/filter-button';
import { FilterAddCard } from '../../components/filter/filter-add-card/filter-add-card';
import { FormText } from '../../components/forms/form-text/form-text';
import { CategoriaDTORespuesta } from '../../models/categoria.model';
import { FiltroDtoRespuesta } from '../../models/filtro.model';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { EnumCategoriaFiltro } from '../../enums/enum-categoria-filtro';

interface ApiError {
  codigoError: string;
  mensaje: string;
  codigoHttp: number;
  url: string;
  metodo: string;
}


@Component({
  selector: 'app-scanner-add-filter',
  imports: [LoadPage, LoadPageError, NavbarAux, FilterButton, FilterAddCard, FormText, ReactiveFormsModule], // Agregar ReactiveFormsModule
  templateUrl: './scanner-add-filter.html',
  styleUrl: './scanner-add-filter.css'
})
export class ScannerAddFilter implements OnInit {
  private readonly filtroService = inject(FiltroService);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  
  idEscaner = signal<number | undefined>(undefined);
  loading = signal<boolean>(false);
  error = signal<ApiError | null>(null);
  loadError = signal<ApiError | null>(null);

  categories = signal<CategoriaDTORespuesta[]>([]);
  allFilters = signal<FiltroDtoRespuesta[]>([]);
  filters = signal<FiltroDtoRespuesta[]>([]);
  searchFilter = signal<string>('');
  selectedCategory = signal<EnumCategoriaFiltro>(EnumCategoriaFiltro.TODOS);
  existingFilters = signal<FiltroDtoRespuesta[]>([]);
  
  // Agregar FormControl para el buscador
  searchControl = new FormControl('');
  
  backPath = computed(() => `/escaner/configuracion/${this.idEscaner()}`);

  displayTitle = computed(() => this.languageService.getTranslation('Agregar Filtro'));

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idEscaner.set(Number(id));
    const existingFiltersState = this.router.getCurrentNavigation()?.extras.state?.['existingFilters'];
    if (existingFiltersState) {
      this.existingFilters.set(existingFiltersState);
    }
      }
    });
    
    // Suscribirse a los cambios del searchControl
    this.searchControl.valueChanges.subscribe(value => {
      this.onSearch(value || '');
    });
    
    this.fetchCategories();
    this.fetchFilters(this.selectedCategory());
  }

  fetchCategories(): void {
    this.loading.set(true);
    this.filtroService.getCategorias().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err);
        this.loading.set(false);
      }
    });
  }

  fetchFilters(category: EnumCategoriaFiltro): void {
    this.loading.set(true);
    this.filtroService.getFiltrosByCategory(category).subscribe({
      next: (data) => {
        this.allFilters.set(data);
        this.filters.set(data);
        this.loading.set(false);
        if (this.searchFilter()) {
          this.applySearch();
        }
      },
      error: (err) => {
        this.loadError.set(err);
        this.loading.set(false);
      }
    });
  }

  onSearch(searchText: string): void {
    this.searchFilter.set(searchText);
    this.applySearch();
  }

  private applySearch(): void {
    const searchText = this.searchFilter().toLowerCase().trim();
    
    if (!searchText) {
      this.filters.set(this.allFilters());
      return;
    }

    const filtered = this.allFilters().filter(filtro => {
      const nombreMatch = filtro.etiquetaNombre.toLowerCase().includes(searchText);
      const descripcionMatch = filtro.etiquetaDescripcion.toLowerCase().includes(searchText);
      return nombreMatch || descripcionMatch;
    });

    this.filters.set(filtered);
  }

  onCategorySelected(category: CategoriaDTORespuesta): void {
    this.selectedCategory.set(category.enumCategoriaFiltro);
    this.searchFilter.set('');
    this.searchControl.setValue(''); // Limpiar el FormControl también
    this.fetchFilters(category.enumCategoriaFiltro);
  }

  onFilterAdded(newFilter: FiltroDtoRespuesta): void {
    this.allFilters.update(currentFilters => [...currentFilters, newFilter]);
    this.filters.update(currentFilters => [...currentFilters, newFilter]);
    this.router.navigate([this.backPath()], { state: { newFilter: newFilter } });
  }
}