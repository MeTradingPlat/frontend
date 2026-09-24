import { Filtro } from '../models/filtro.interface';
import { buildFilterSections } from './filter-sections.util';

const TECHNICAL_TYPE = 'TECNICO';

export function applyAnyFilterMode(filtros: Filtro[], enabled: boolean): Filtro[] {
  const groupByIndex = new Map<number, number>();
  if (enabled) {
    let nextGroup = 1;
    for (const section of buildFilterSections(filtros)) {
      if (section.tipo !== TECHNICAL_TYPE || section.items.length < 2) continue;
      section.items.forEach(item => groupByIndex.set(item.index, nextGroup));
      nextGroup++;
    }
  }
  return filtros.map((filtro, index) => {
    const grupo = groupByIndex.get(index);
    return (filtro.grupoAlternativo ?? undefined) === grupo ? filtro : { ...filtro, grupoAlternativo: grupo };
  });
}
