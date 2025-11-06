import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Filtro } from '../../../models/filtro.interface';
import { ConditionalParameter } from './conditional-parameter/conditional-parameter';
import { FloatParameter } from './float-parameter/float-parameter';
import { IntegerParameter } from './integer-parameter/integer-parameter';
import { OptionsParameter } from './options-parameter/options-parameter';

@Component({
  selector: 'app-card-selected-filters',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
    ConditionalParameter,
    FloatParameter,
    IntegerParameter,
    OptionsParameter
  ],
  templateUrl: './card-selected-filters.html',
  styleUrl: './card-selected-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardSelectedFilters {
  filtros = input.required<Filtro[]>();
  validationErrors = input<Record<string, Record<string, string>>>({});
  openAddDialog = output<void>();
  removeFilter = output<number>();

  onAddFilter(): void {
    this.openAddDialog.emit();
  }

  onRemoveFilter(index: number): void {
    this.removeFilter.emit(index);
  }

  getFilterErrors(filtroEnum: string): Record<string, string> | undefined {
    return this.validationErrors()[filtroEnum];
  }
}
