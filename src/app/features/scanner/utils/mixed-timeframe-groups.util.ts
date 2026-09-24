import { Filtro } from '../models/filtro.interface';

const TIMEFRAME_PARAMETER_PREFIX = 'TIMEFRAME';
const NO_TIMEFRAME_KEY = 'DEFAULT';

export function filterTimeframeKey(filtro: Filtro): string {
  const parametro = filtro.parametros.find(p => p.enumParametro.startsWith(TIMEFRAME_PARAMETER_PREFIX));
  const valor = (parametro?.objValorSeleccionado as { valor?: unknown } | undefined)?.valor;
  return typeof valor === 'string' && valor ? valor.replace(/^_/, '') : NO_TIMEFRAME_KEY;
}

export function mixedTimeframeGroups(filtros: Filtro[]): Set<number> {
  const timeframesPorGrupo = new Map<number, Set<string>>();
  for (const filtro of filtros) {
    if (filtro.grupoAlternativo === undefined) continue;
    const timeframes = timeframesPorGrupo.get(filtro.grupoAlternativo) ?? new Set<string>();
    timeframes.add(filterTimeframeKey(filtro));
    timeframesPorGrupo.set(filtro.grupoAlternativo, timeframes);
  }
  return new Set([...timeframesPorGrupo].filter(([, tfs]) => tfs.size > 1).map(([grupo]) => grupo));
}
