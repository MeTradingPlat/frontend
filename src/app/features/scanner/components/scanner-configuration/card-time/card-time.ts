import { ChangeDetectionStrategy, Component, effect, inject, input, model, signal } from '@angular/core';
import { Escaner } from '../../../models/escaner.interface';
import { FormControl, FormGroupDirective, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatCardModule } from '@angular/material/card';
import { ErrorStateMatcher, provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { TimezoneService } from '../../../../../core/services/timezone.service';

/** Horarios oficiales del mercado de EE.UU. en hora de Nueva York (ET) --
 * confirmados contra fuentes publicas (NYSE/Nasdaq): pre-market 4:00am,
 * apertura regular 9:30am, cierre regular 4:00pm, cierre post-market
 * 8:00pm. */
const MARKET_SESSIONS = {
  PRE_MARKET: { start: '04:00:00', end: '09:30:00' },
  REGULAR: { start: '09:30:00', end: '16:00:00' },
  POST_MARKET: { start: '16:00:00', end: '20:00:00' },
} as const;
type MarketSession = keyof typeof MARKET_SESSIONS;

/** Custom error state matcher that shows errors when errorMessage is present */
class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private hasError: () => boolean) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return this.hasError();
  }
}

@Component({
  selector: 'app-card-time',
  imports: [MatFormFieldModule, MatInputModule, MatTimepickerModule, MatCardModule, MatSelectModule, MatButtonToggleModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './card-time.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './card-time.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardTime {
  private timezoneService = inject(TimezoneService);

  scanner = model.required<Escaner>();
  errors = input<Record<string, string>>({});
  startTime = new FormControl<Date | null>(null);
  endTime = new FormControl<Date | null>(null);
  selectEjecution = new FormControl<string>('UNA_VEZ', { nonNullable: true });

  // Señales para mostrar conversión a hora de mercado (Nueva York) y UTC
  horaInicioLocal = signal<string>('');
  horaInicioNY = signal<string>('');
  horaInicioUTC = signal<string>('');
  horaFinLocal = signal<string>('');
  horaFinNY = signal<string>('');
  horaFinUTC = signal<string>('');
  timezoneAbbreviation = signal<string>('');
  nyAbbreviation = signal<string>('');

  readonly marketSessions: { key: MarketSession; labelKey: string }[] = [
    { key: 'PRE_MARKET', labelKey: 'SCANNER.SESSION_PRE_MARKET' },
    { key: 'REGULAR', labelKey: 'SCANNER.SESSION_REGULAR' },
    { key: 'POST_MARKET', labelKey: 'SCANNER.SESSION_POST_MARKET' },
  ];

  // Error state matchers
  startTimeErrorMatcher = new CustomErrorStateMatcher(() => !!this.errors()['horaInicio']);
  endTimeErrorMatcher = new CustomErrorStateMatcher(() => !!this.errors()['horaFin']);

  constructor() {
    // Inicializar timezone abbreviation
    this.timezoneAbbreviation.set(this.timezoneService.getTimezoneAbbreviation());
    this.nyAbbreviation.set(this.timezoneService.getNewYorkAbbreviation());

    // Inicializar FormControls con valores del scanner o defaults
    effect(() => {
      const scannerValue = this.scanner();

      if (scannerValue.horaInicio) {
        // Backend envía en UTC, convertir a local para mostrar en el picker
        const localTime = this.timezoneService.convertUTCToLocal(scannerValue.horaInicio);
        this.startTime.setValue(this.parseTime(localTime), { emitEvent: false });
        this.horaInicioUTC.set(scannerValue.horaInicio);
        this.horaInicioLocal.set(localTime);
        this.horaInicioNY.set(this.timezoneService.convertLocalToNewYork(localTime));
      } else {
        const defaultStart = new Date();
        defaultStart.setHours(9, 30, 0);
        this.startTime.setValue(defaultStart, { emitEvent: false });
      }

      if (scannerValue.horaFin) {
        // Backend envía en UTC, convertir a local para mostrar en el picker
        const localTime = this.timezoneService.convertUTCToLocal(scannerValue.horaFin);
        this.endTime.setValue(this.parseTime(localTime), { emitEvent: false });
        this.horaFinUTC.set(scannerValue.horaFin);
        this.horaFinLocal.set(localTime);
        this.horaFinNY.set(this.timezoneService.convertLocalToNewYork(localTime));
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
      const localTime = this.formatTime(value);
      const utcTime = this.timezoneService.convertLocalToUTC(localTime);

      // Actualizar signals para mostrar en UI
      this.horaInicioLocal.set(localTime);
      this.horaInicioNY.set(this.timezoneService.convertLocalToNewYork(localTime));
      this.horaInicioUTC.set(utcTime);

      // Guardar en UTC
      this.scanner.update(s => ({
        ...s,
        horaInicio: utcTime
      }));
    });

    this.endTime.valueChanges.subscribe(value => {
      const localTime = this.formatTime(value);
      const utcTime = this.timezoneService.convertLocalToUTC(localTime);

      // Actualizar signals para mostrar en UI
      this.horaFinLocal.set(localTime);
      this.horaFinNY.set(this.timezoneService.convertLocalToNewYork(localTime));
      this.horaFinUTC.set(utcTime);

      // Guardar en UTC
      this.scanner.update(s => ({
        ...s,
        horaFin: utcTime
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

  /** Traduce una sesion fija de mercado (pre-market/regular/post-market,
   * definida en hora de Nueva York) a la hora local de quien esta
   * configurando el escaner, y carga ambos campos de una vez -- evita que
   * alguien fuera de Nueva York tenga que calcular a mano la diferencia
   * horaria (confirmado en vivo: eso fue justo lo que causo que un
   * escaner de "post-market" terminara corriendo en horario regular). */
  applySession(session: MarketSession): void {
    const { start, end } = MARKET_SESSIONS[session];
    this.startTime.setValue(this.parseTime(this.timezoneService.convertNewYorkToLocal(start)));
    this.endTime.setValue(this.parseTime(this.timezoneService.convertNewYorkToLocal(end)));
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
