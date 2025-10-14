
import { Component, input, output, ChangeDetectionStrategy, computed, inject, effect, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { EnumConfigurationCard } from '../../../../enums/enum-configuration-card';
import { FiltroService } from '../../../../services/filtro.service';
import { FiltroDtoRespuesta } from '../../../../models/filtro.model';
import { FiltroDtoPeticion } from '../../../../models/filtro-peticion.model'; // Import FiltroDtoPeticion
import { EscanerDTOPeticion } from '../../../../models/escaner.model';
import { FilterSelectedCard } from "../../../filter/filter-selected-card/filter-selected-card";

@Component({
  selector: 'app-card-filter',
  standalone: true,
  imports: [
    CommonModule,
    FilterSelectedCard
  ],
  templateUrl: './card-filter.html',
  styleUrl: './card-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardFilter implements OnInit {
  submitted = input<boolean>(false);
  currentFilters = input<FiltroDtoPeticion[]>([]); // Changed type to FiltroDtoPeticion[]
  idEscaner = input<number | undefined>(undefined);

  cardDataChange = output<{ cardType: EnumConfigurationCard, data: any }>();
  formValidityChange = output<{ cardType: EnumConfigurationCard, isValid: boolean }>();

  private filtroService = inject(FiltroService);
  private router = inject(Router);

  filtros = signal<FiltroDtoRespuesta[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Textos localizados como señales o propiedades
  readonly title = $localize`Filtros`;
  readonly loadingText = $localize`Cargando filtros...`;
  readonly addFilterButtonText = $localize`Agregar Filtro`;

  displayTitle = computed(() => {
    return this.title;
  });

  constructor() {
    effect(() => {
      const id = this.idEscaner();
      const currentFiltersInput = this.currentFilters();

      if (currentFiltersInput && currentFiltersInput.length > 0) {
        // When currentFilters input is provided, use it to set the internal filtros signal
        // This assumes currentFiltersInput is already in FiltroDtoRespuesta format or can be mapped.
        // For now, we'll assume it's compatible enough for display.
        // A more robust solution might involve a mapping function here if the types are truly different.
        this.filtros.set(currentFiltersInput as FiltroDtoRespuesta[]); 
      } else if (id !== undefined) {
        this.fetchScannerFiltros(id);
      }
    });
  }


  ngOnInit(): void {
    // The effect has been moved to the constructor to resolve NG0203 error.
  }

  fetchScannerFiltros(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.filtroService.getScannerFiltros(id).subscribe({
      next: (data) => {
        this.filtros.set(data);
        this.loading.set(false);
        this.emitCardDataChange();
        this.emitFormValidityChange();
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
        this.emitFormValidityChange();
      }
    });
  }

  onAddFilter(): void {
    if (this.idEscaner()) {
      this.router.navigate(['/escaner/agregar-filtro', this.idEscaner()], { state: { existingFilters: this.filtros() } });
    }
  }

  handleFilterChange(event: any, index: number): void {
    
    
    
  }

  onFilterChange(updatedFiltro: FiltroDtoRespuesta, index: number): void {
    const currentFiltros = this.filtros();
    const newFiltros = [...currentFiltros];
    newFiltros[index] = updatedFiltro;
    this.filtros.set(newFiltros);
    this.emitCardDataChange();
    this.emitFormValidityChange();
  }

  private emitCardDataChange(): void {
    this.cardDataChange.emit({ cardType: EnumConfigurationCard.FILTERS, data: { filtros: this.filtros() } });
  }

  private emitFormValidityChange(): void {
    const isValid = this.filtros().length > 0;
    this.formValidityChange.emit({ cardType: EnumConfigurationCard.FILTERS, isValid: isValid });
  }
}
