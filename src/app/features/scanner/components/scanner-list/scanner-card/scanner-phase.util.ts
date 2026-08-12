export type ScannerPhase = 'WAITING' | 'ACTIVE' | 'FINISHED';

export interface ScannerPhaseResult {
  phase: ScannerPhase;
  translationKey: string;
  displayTime: string;
}

function utcTimeToMinutes(hhmmss: string): number {
  const [hours, minutes] = hhmmss.split(':').map(Number);
  return hours * 60 + minutes;
}

function utcMinutesOfDay(now: Date): number {
  return now.getUTCHours() * 60 + now.getUTCMinutes();
}

/** Deriva en que fase de su ventana esta un escaner ya iniciado, solo a
 * partir de horaInicio/horaFin -- no replica el calendario de feriados
 * bursatiles (solo lo tiene signal-processing-service), asi que un escaner
 * INICIADO en feriado mostrara "esperando"/"activo" en vez de reconocer que
 * no es dia habil. Aceptable como primera version. */
export function computeScannerPhase(
  horaInicioUTC: string,
  horaFinUTC: string,
  horaInicioLocal: string,
  horaFinLocal: string,
  now: Date,
): ScannerPhaseResult {
  const startMin = utcTimeToMinutes(horaInicioUTC);
  const endMin = utcTimeToMinutes(horaFinUTC);
  const nowMin = utcMinutesOfDay(now);

  const withinWindow = startMin <= endMin
    ? nowMin >= startMin && nowMin <= endMin
    : nowMin >= startMin || nowMin <= endMin;

  if (withinWindow) {
    return { phase: 'ACTIVE', translationKey: 'SCANNER.PHASE_ACTIVE', displayTime: horaFinLocal };
  }
  if (startMin <= endMin && nowMin > endMin) {
    return { phase: 'FINISHED', translationKey: 'SCANNER.PHASE_FINISHED', displayTime: horaInicioLocal };
  }
  return { phase: 'WAITING', translationKey: 'SCANNER.PHASE_WAITING', displayTime: horaInicioLocal };
}
