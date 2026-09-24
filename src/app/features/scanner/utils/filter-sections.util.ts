import { Filtro } from '../models/filtro.interface';
import { filterTimeframeKey, filterTimeframeLabel } from './mixed-timeframe-groups.util';

export interface FilterSectionItem {
  filtro: Filtro;
  index: number;
}

export interface FilterSection {
  key: string;
  tipo: string;
  timeframe?: string;
  items: FilterSectionItem[];
}

const TECHNICAL_TYPE = 'TECNICO';
const SECTION_ORDER = ['ESTATICO', 'DINAMICO', TECHNICAL_TYPE];

function sectionKeyOf(filtro: Filtro): { key: string; tipo: string; timeframe?: string } {
  const tipo = filtro.enumTipoFiltro ?? TECHNICAL_TYPE;
  if (tipo !== TECHNICAL_TYPE) return { key: tipo, tipo };
  const timeframe = filterTimeframeLabel(filtro);
  return { key: `${tipo}|${filterTimeframeKey(filtro)}`, tipo, timeframe };
}

export function buildFilterSections(filtros: Filtro[]): FilterSection[] {
  const sections = new Map<string, FilterSection>();
  filtros.forEach((filtro, index) => {
    const { key, tipo, timeframe } = sectionKeyOf(filtro);
    const section = sections.get(key) ?? { key, tipo, timeframe, items: [] };
    section.items.push({ filtro, index });
    sections.set(key, section);
  });
  return [...sections.values()].sort(
    (a, b) => SECTION_ORDER.indexOf(a.tipo) - SECTION_ORDER.indexOf(b.tipo)
  );
}

export function groupOwnerBySection(sections: FilterSection[]): Map<number, string> {
  const owners = new Map<number, string>();
  for (const section of sections) {
    for (const { filtro } of section.items) {
      if (filtro.grupoAlternativo != null && !owners.has(filtro.grupoAlternativo)) {
        owners.set(filtro.grupoAlternativo, section.key);
      }
    }
  }
  return owners;
}
