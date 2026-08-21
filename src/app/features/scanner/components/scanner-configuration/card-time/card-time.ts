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
import { I18nRefreshDirective } from '../../../../../shared/directives/i18n-refresh.directive';

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
  imports: [MatFormFieldModule, MatInputModule, MatTimepickerModule, MatCardModule, MatSelectModule, MatButtonToggleModule, ReactiveFormsModule, TranslatePipe, I18nRefreshDirective],
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

  // Fuera de este rango el mercado esta genuinamente cerrado (ni pre-market
  // extendido) -- mismo limite que usa signal-processing-service para
  // recortar horaInicio/horaFin (calendar.py: _MARKET_OPEN_TIME/_REGULAR_CLOSE).
  // Sin esto el usuario podia armar un escaner que nunca iba a poder operar.
  readonly minTime = this.parseTime(MARKET_SESSIONS.PRE_MARKET.start);
  readonly maxTime = this.parseTime(MARKET_SESSIONS.POST_MARKET.end);

  // El picker edita directamente hora de Nueva York -- la hora local del
  // usuario queda solo como referencia (no editable) para que nunca haya
  // que convertir mentalmente "mi hora -> hora de mercado" (confirmado en
  // vivo: eso fue justo lo que causo que un escaner de "post-market"
  // terminara corriendo en horario regular por no tener en cuenta el
  // horario de verano).
  horaInicioLocal = signal<string>('');
  horaFinLocal = signal<string>('');
  timezoneAbbreviation = signal<string>('');

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

    // Inicializar FormControls con valores del scanner o defaults
    effect(() => {
      const scannerValue = this.scanner();

      if (scannerValue.horaInicio) {
        // Backend envia en UTC, convertir a hora de Nueva York para mostrar
        // en el picker (el picker ES hora de mercado, no hora local).
        const nyTime = this.timezoneService.convertUTCToNewYork(scannerValue.horaInicio);
        this.startTime.setValue(this.parseTime(nyTime), { emitEvent: false });
        this.horaInicioLocal.set(this.timezoneService.convertNewYorkToLocal(nyTime));
      } else {
        const defaultStart = new Date();
        defaultStart.setHours(9, 30, 0);
        this.startTime.setValue(defaultStart, { emitEvent: false });
      }

      if (scannerValue.horaFin) {
        const nyTime = this.timezoneService.convertUTCToNewYork(scannerValue.horaFin);
        this.endTime.setValue(this.parseTime(nyTime), { emitEvent: false });
        this.horaFinLocal.set(this.timezoneService.convertNewYorkToLocal(nyTime));
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
      const nyTime = this.formatTime(value);
      this.horaInicioLocal.set(this.timezoneService.convertNewYorkToLocal(nyTime));

      // Guardar en UTC
      this.scanner.update(s => ({
        ...s,
        horaInicio: this.timezoneService.convertNewYorkToUTC(nyTime)
      }));
    });

    this.endTime.valueChanges.subscribe(value => {
      const nyTime = this.formatTime(value);
      this.horaFinLocal.set(this.timezoneService.convertNewYorkToLocal(nyTime));

      // Guardar en UTC
      this.scanner.update(s => ({
        ...s,
        horaFin: this.timezoneService.convertNewYorkToUTC(nyTime)
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

  /** Carga una sesion fija de mercado -- el picker ya esta en hora de
   * Nueva York, asi que se cargan los valores tal cual, sin convertir. */
  applySession(session: MarketSession): void {
    const { start, end } = MARKET_SESSIONS[session];
    this.startTime.setValue(this.parseTime(start));
    this.endTime.setValue(this.parseTime(end));
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
