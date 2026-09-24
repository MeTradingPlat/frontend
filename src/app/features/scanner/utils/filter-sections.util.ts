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
  required: FilterSectionItem[];
  alternatives: FilterSectionItem[];
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
    const section = sections.get(key) ?? { key, tipo, timeframe, items: [], required: [], alternatives: [] };
    const item = { filtro, index };
    section.items.push(item);
    (filtro.grupoAlternativo != null ? section.alternatives : section.required).push(item);
    sections.set(key, section);
  });
  return [...sections.values()].sort(
    (a, b) => SECTION_ORDER.indexOf(a.tipo) - SECTION_ORDER.indexOf(b.tipo)
  );
}

export function groupIdForSection(section: FilterSection, sections: FilterSection[]): number {
  const own = section.items.map(i => i.filtro.grupoAlternativo).find(g => g != null);
  if (own != null) return own;
  const used = new Set(
    sections
      .filter(s => s.key !== section.key)
      .flatMap(s => s.items.map(i => i.filtro.grupoAlternativo))
      .filter((g): g is number => g != null)
  );
  let id = 1;
  while (used.has(id)) id++;
  return id;
}
