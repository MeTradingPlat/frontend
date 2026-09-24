import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Filtro } from '../../../models/filtro.interface';
import { ConditionalParameter } from './conditional-parameter/conditional-parameter';
import { FloatParameter } from './float-parameter/float-parameter';
import { IntegerParameter } from './integer-parameter/integer-parameter';
import { OptionsParameter } from './options-parameter/options-parameter';
import { I18nRefreshDirective } from '../../../../../shared/directives/i18n-refresh.directive';
import { getFilterTypeIcon } from '../../../utils/filter-type-icon.util';
import { FilterSection, buildFilterSections, groupIdForSection } from '../../../utils/filter-sections.util';

@Component({
  selector: 'app-card-selected-filters',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatSlideToggleModule,
    NgTemplateOutlet,
    MatTooltipModule,
    TranslatePipe,
    ConditionalParameter,
    FloatParameter,
    IntegerParameter,
    OptionsParameter,
    I18nRefreshDirective
  ],
  templateUrl: './card-selected-filters.html',
  styleUrl: './card-selected-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardSelectedFilters {
  filtros = input.required<Filtro[]>();
  sections = computed(() => buildFilterSections(this.filtros()));
  validationErrors = input<Record<string, Record<string, string>>>({});
  openAddDialog = output<void>();
  removeFilter = output<number>();
  alternativeGroupChange = output<{ index: number; grupo: number | undefined }>();

  readonly getFilterTypeIcon = getFilterTypeIcon;

  onAddFilter(): void {
    this.openAddDialog.emit();
  }

  onRemoveFilter(index: number): void {
    this.removeFilter.emit(index);
  }

  onToggleAlternative(section: FilterSection, index: number, alternative: boolean): void {
    const grupo = alternative ? groupIdForSection(section, this.sections()) : undefined;
    this.alternativeGroupChange.emit({ index, grupo });
  }

  getFilterErrors(filtroEnum: string): Record<string, string> | undefined {
    return this.validationErrors()[filtroEnum];
  }
}
