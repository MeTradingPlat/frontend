import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnumConfigurationCard } from '../../../../enums/enum-configuration-card';
import { EscanerDTOPeticion } from '../../../../models/escaner.model';

@Component({
  selector: 'app-card-filter',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './card-filter.html',
  styleUrl: './card-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardFilter {
  submitted = input<boolean>(false);
  scannerData = input<EscanerDTOPeticion | undefined>(undefined);
  cardDataChange = output<{ cardType: EnumConfigurationCard, data: any }>();
  formValidityChange = output<{ cardType: EnumConfigurationCard, isValid: boolean }>();

  displayTitle = computed(() => {
    return $localize`Filtros`;
  });

  // No specific form logic for filters yet, as it's not present in the original component.
  // This component will be extended later if filter configuration is added.

  constructor() { }
}
