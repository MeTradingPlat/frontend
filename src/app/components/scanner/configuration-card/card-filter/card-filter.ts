import { Component, input, output, ChangeDetectionStrategy, computed, inject, effect, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnumConfigurationCard } from '../../../../enums/enum-configuration-card';
import { FiltroService } from '../../../../services/filtro.service';
import { FiltroDtoRespuesta } from '../../../../models/filtro.model';
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
  idEscaner = input<number | undefined>(undefined);
  scannerData = input<EscanerDTOPeticion | undefined>(undefined); // Keep scannerData input as it might be used by other cards

  cardDataChange = output<{ cardType: EnumConfigurationCard, data: any }>();
  formValidityChange = output<{ cardType: EnumConfigurationCard, isValid: boolean }>();

  private filtroService = inject(FiltroService);

  filtros = signal<FiltroDtoRespuesta[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  displayTitle = computed(() => {
    return $localize`Filtros`;
  });

  constructor() {
    effect(() => {
      const id = this.idEscaner();
      if (id !== undefined) {
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
        this.emitCardDataChange(); // Emit data after fetching
        this.emitFormValidityChange(); // Emit validity after fetching
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar filtros');
        this.loading.set(false);
        this.emitFormValidityChange(); // Emit validity even on error
      }
    });
  }

  onAddFilter(): void {
    console.log('Agregar filtro button clicked'); // TODO: Implement navigation to add filter
  }

  // Helper method to handle the event from child component and cast it
  handleFilterChange(event: any, index: number): void {
    this.onFilterChange(event as FiltroDtoRespuesta, index);
  }

  onFilterChange(updatedFiltro: FiltroDtoRespuesta, index: number): void { // Explicitly typed updatedFiltro
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
    // For now, assuming valid if filters exist.
    // A more robust solution would involve validating each filter's parameters.
    const isValid = this.filtros().length > 0;
    this.formValidityChange.emit({ cardType: EnumConfigurationCard.FILTERS, isValid: isValid });
  }
}
