import { Filtro } from '../models/filtro.interface';
import { Parametro } from '../models/parametro.interface';

const TIMEFRAME_PARAMETER_PREFIX = 'TIMEFRAME';
const NO_TIMEFRAME_KEY = 'DEFAULT';

function findTimeframeParameter(filtro: Filtro): Parametro | undefined {
  return filtro.parametros.find(p => p.enumParametro.startsWith(TIMEFRAME_PARAMETER_PREFIX));
}

export function filterTimeframeKey(filtro: Filtro): string {
  const valor = (findTimeframeParameter(filtro)?.objValorSeleccionado as { valor?: unknown } | undefined)?.valor;
  return typeof valor === 'string' && valor ? valor.replace(/^_/, '') : NO_TIMEFRAME_KEY;
}

export function filterTimeframeLabel(filtro: Filtro): string {
  return findTimeframeParameter(filtro)?.objValorSeleccionado.etiqueta || filterTimeframeKey(filtro);
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
