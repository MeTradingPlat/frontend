import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Filtro } from '../../../models/filtro.interface';
import { ConditionalParameter } from './conditional-parameter/conditional-parameter';
import { FloatParameter } from './float-parameter/float-parameter';
import { IntegerParameter } from './integer-parameter/integer-parameter';
import { OptionsParameter } from './options-parameter/options-parameter';
import { I18nRefreshDirective } from '../../../../../shared/directives/i18n-refresh.directive';
import { getFilterTypeIcon } from '../../../utils/filter-type-icon.util';
import { ALTERNATIVE_GROUP_OPTIONS, alternativeGroupLetter } from '../../../utils/alternative-group.util';
import { mixedTimeframeGroups } from '../../../utils/mixed-timeframe-groups.util';
import { buildFilterSections, groupOwnerBySection } from '../../../utils/filter-sections.util';

@Component({
  selector: 'app-card-selected-filters',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatSelectModule,
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
  mixedGroups = computed(() => mixedTimeframeGroups(this.filtros()));
  sections = computed(() => buildFilterSections(this.filtros()));
  private groupOwners = computed(() => groupOwnerBySection(this.sections()));
  validationErrors = input<Record<string, Record<string, string>>>({});
  openAddDialog = output<void>();
  removeFilter = output<number>();
  alternativeGroupChange = output<{ index: number; grupo: number | undefined }>();

  readonly getFilterTypeIcon = getFilterTypeIcon;
  readonly alternativeGroupOptions = ALTERNATIVE_GROUP_OPTIONS;
  readonly alternativeGroupLetter = alternativeGroupLetter;

  onAddFilter(): void {
    this.openAddDialog.emit();
  }

  onRemoveFilter(index: number): void {
    this.removeFilter.emit(index);
  }

  onAlternativeGroupChange(index: number, grupo: number | undefined): void {
    this.alternativeGroupChange.emit({ index, grupo });
  }

  isGroupTakenElsewhere(sectionKey: string, grupo: number): boolean {
    const owner = this.groupOwners().get(grupo);
    return owner !== undefined && owner !== sectionKey;
  }

  getFilterErrors(filtroEnum: string): Record<string, string> | undefined {
    return this.validationErrors()[filtroEnum];
  }
}
