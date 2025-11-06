import { ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';
import { Escaner } from '../../../models/escaner.interface';
import { FormControl, FormGroupDirective, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatCardModule } from '@angular/material/card';
import { ErrorStateMatcher, provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

/** Custom error state matcher that shows errors when errorMessage is present */
class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private hasError: () => boolean) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return this.hasError();
  }
}

@Component({
  selector: 'app-card-time',
  imports: [MatFormFieldModule, MatInputModule, MatTimepickerModule, MatCardModule, MatSelectModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './card-time.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './card-time.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardTime {
  scanner = model.required<Escaner>();
  errors = input<Record<string, string>>({});
  startTime = new FormControl<Date | null>(null);
  endTime = new FormControl<Date | null>(null);
  selectEjecution = new FormControl<string>('UNA_VEZ', { nonNullable: true });

  // Error state matchers
  startTimeErrorMatcher = new CustomErrorStateMatcher(() => !!this.errors()['horaInicio']);
  endTimeErrorMatcher = new CustomErrorStateMatcher(() => !!this.errors()['horaFin']);

  constructor() {
    // Inicializar FormControls con valores del scanner o defaults
    effect(() => {
      const scannerValue = this.scanner();

      if (scannerValue.horaInicio) {
        this.startTime.setValue(this.parseTime(scannerValue.horaInicio), { emitEvent: false });
      } else {
        const defaultStart = new Date();
        defaultStart.setHours(9, 30, 0);
        this.startTime.setValue(defaultStart, { emitEvent: false });
      }

      if (scannerValue.horaFin) {
        this.endTime.setValue(this.parseTime(scannerValue.horaFin), { emitEvent: false });
      } else {
        const defaultEnd = new Date();
        defaultEnd.setHours(16, 0, 0);
        this.endTime.setValue(defaultEnd, { emitEvent: false });
      }

      if (scannerValue.objTipoEjecucion?.enumTipoEjecucion) {
        this.selectEjecution.setValue(scannerValue.objTipoEjecucion.enumTipoEjecucion, { emitEvent: false });
      }
    });

    // Sincronizar cambios hacia el scanner
    this.startTime.valueChanges.subscribe(value => {
      this.scanner.update(s => ({
        ...s,
        horaInicio: this.formatTime(value)
      }));
    });

    this.endTime.valueChanges.subscribe(value => {
      this.scanner.update(s => ({
        ...s,
        horaFin: this.formatTime(value)
      }));
    });

    this.selectEjecution.valueChanges.subscribe(value => {
      this.scanner.update(s => ({
        ...s,
        objTipoEjecucion: {
          ...s.objTipoEjecucion,
          enumTipoEjecucion: value
        }
      }));
    });
  }

  private formatTime(date: Date | null): string {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private parseTime(timeString: string): Date {
    const date = new Date();
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    date.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0);
    return date;
  }
}
