import { computeScannerPhase, computeScannerStatus, ScannerPhaseResult } from './scanner-phase.util';

describe('computeScannerPhase', () => {
  // Ventana 13:00-21:00 UTC, "ahora" 15:00 UTC -- dentro del rango horario.
  const horaInicioUTC = '13:00:00';
  const horaFinUTC = '21:00:00';
  const now = new Date(Date.UTC(2026, 7, 22, 15, 0, 0)); // sabado

  it('no queda ACTIVE un dia no habil aunque la hora de reloj caiga dentro de la ventana', () => {
    const result = computeScannerPhase(
      horaInicioUTC, horaFinUTC, '09:00 AM', '05:00 PM', now,
      { hoyEsDiaHabil: false, proximoDiaHabil: '2026-08-24' }, 'es', 'hoy',
    );
    expect(result.phase).not.toBe('ACTIVE');
    expect(result.phase).toBe('WAITING');
  });

  it('sigue ACTIVE dentro de la ventana en un dia habil (sin regresion)', () => {
    const result = computeScannerPhase(
      horaInicioUTC, horaFinUTC, '09:00 AM', '05:00 PM', now,
      { hoyEsDiaHabil: true, proximoDiaHabil: '2026-08-24' }, 'es', 'hoy',
    );
    expect(result.phase).toBe('ACTIVE');
  });

  it('sigue ACTIVE dentro de la ventana cuando el calendario no cargo (null)', () => {
    const result = computeScannerPhase(
      horaInicioUTC, horaFinUTC, '09:00 AM', '05:00 PM', now,
      null, 'es', 'hoy',
    );
    expect(result.phase).toBe('ACTIVE');
  });
});

describe('computeScannerStatus', () => {
  const activePhase: ScannerPhaseResult = { phase: 'ACTIVE', translationKey: 'x', displayTime: '', day: '' };
  const waitingPhase: ScannerPhaseResult = { phase: 'WAITING', translationKey: 'x', displayTime: '', day: '' };
  const finishedPhase: ScannerPhaseResult = { phase: 'FINISHED', translationKey: 'x', displayTime: '', day: '' };

  it('es STOPPED cuando el escaner no esta INICIADO, sin importar la fase', () => {
    expect(computeScannerStatus('DETENIDO', activePhase)).toBe('STOPPED');
    expect(computeScannerStatus(undefined, null)).toBe('STOPPED');
  });

  it('es RUNNING solo con INICIADO + fase ACTIVE', () => {
    expect(computeScannerStatus('INICIADO', activePhase)).toBe('RUNNING');
  });

  it('es WAITING con INICIADO + fase WAITING o FINISHED', () => {
    expect(computeScannerStatus('INICIADO', waitingPhase)).toBe('WAITING');
    expect(computeScannerStatus('INICIADO', finishedPhase)).toBe('WAITING');
  });
});
