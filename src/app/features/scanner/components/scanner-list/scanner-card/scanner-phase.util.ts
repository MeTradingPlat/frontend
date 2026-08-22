export type ScannerPhase = 'WAITING' | 'ACTIVE' | 'FINISHED';

export interface CalendarioEstado {
  hoyEsDiaHabil: boolean;
  proximoDiaHabil: string; // YYYY-MM-DD
}

export interface ScannerPhaseResult {
  phase: ScannerPhase;
  translationKey: string;
  displayTime: string;
  /** "hoy" o una fecha corta ("lun. 17 ago") -- vacio para la fase ACTIVE. */
  day: string;
}

function utcTimeToMinutes(hhmmss: string): number {
  const [hours, minutes] = hhmmss.split(':').map(Number);
  return hours * 60 + minutes;
}

function utcMinutesOfDay(now: Date): number {
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

function formatDay(isoDate: string, locale: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: 'short' }).format(date);
}

/** Deriva en que fase de su ventana esta un escaner ya iniciado, y en que
 * dia cae la proxima ocurrencia -- usa el calendario real de dias habiles
 * (feriados de mercado incluidos) cuando esta disponible; si no llego todavia
 * (o fallo la carga), cae de vuelta a solo dias de semana, sin feriados. */
export function computeScannerPhase(
  horaInicioUTC: string,
  horaFinUTC: string,
  horaInicioLocal: string,
  horaFinLocal: string,
  now: Date,
  calendario: CalendarioEstado | null,
  locale: string,
  todayLabel: string,
): ScannerPhaseResult {
  const startMin = utcTimeToMinutes(horaInicioUTC);
  const endMin = utcTimeToMinutes(horaFinUTC);
  const nowMin = utcMinutesOfDay(now);

  // El rango horario solo no alcanza -- sin el chequeo de dia habil, un
  // sabado/domingo/feriado cuya hora de reloj cae dentro de la ventana
  // configurada mostraba ACTIVE (spinner girando) aunque el backend
  // (is_within_window/next_trading_window en signal-processing-service) este
  // correctamente dormido esperando el proximo dia habil.
  const withinWindow = (startMin <= endMin
    ? nowMin >= startMin && nowMin <= endMin
    : nowMin >= startMin || nowMin <= endMin)
    && (!calendario || calendario.hoyEsDiaHabil);

  if (withinWindow) {
    return { phase: 'ACTIVE', translationKey: 'SCANNER.PHASE_ACTIVE', displayTime: horaFinLocal, day: '' };
  }

  // Si la hora de inicio de hoy todavia no llega (ventana normal) o estamos
  // en el hueco previo a que arranque hoy (ventana que cruza medianoche), y
  // hoy mismo es un dia habil (o no sabemos todavia), la proxima ocurrencia
  // es hoy mismo.
  const startStillAheadToday = startMin <= endMin ? nowMin < startMin : nowMin > endMin && nowMin < startMin;
  const targetIsToday = startStillAheadToday && (!calendario || calendario.hoyEsDiaHabil);

  if (targetIsToday) {
    return { phase: 'WAITING', translationKey: 'SCANNER.PHASE_WAITING', displayTime: horaInicioLocal, day: todayLabel };
  }

  const phase: ScannerPhase = (startMin <= endMin && nowMin > endMin) ? 'FINISHED' : 'WAITING';
  const translationKey = phase === 'FINISHED' ? 'SCANNER.PHASE_FINISHED' : 'SCANNER.PHASE_WAITING';
  const day = calendario ? formatDay(calendario.proximoDiaHabil, locale) : '';
  return { phase, translationKey, displayTime: horaInicioLocal, day };
}
