import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
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
import { buildFilterSections } from '../../../utils/filter-sections.util';

@Component({
  selector: 'app-card-selected-filters',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatSlideToggleModule,
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
  private parameterVersion = signal(0);
  sections = computed(() => {
    this.parameterVersion();
    return buildFilterSections(this.filtros());
  });
  validationErrors = input<Record<string, Record<string, string>>>({});
  openAddDialog = output<void>();
  removeFilter = output<number>();
  anyMode = input<boolean>(false);
  anyModeChange = output<boolean>();
  filtersChanged = output<void>();

  readonly getFilterTypeIcon = getFilterTypeIcon;

  onAddFilter(): void {
    this.openAddDialog.emit();
  }

  onRemoveFilter(index: number): void {
    this.removeFilter.emit(index);
  }

  onParameterChanged(): void {
    this.parameterVersion.update(version => version + 1);
    this.filtersChanged.emit();
  }

  onAnyModeChange(enabled: boolean): void {
    this.anyModeChange.emit(enabled);
  }

  getFilterErrors(filtroEnum: string): Record<string, string> | undefined {
    return this.validationErrors()[filtroEnum];
  }
}
