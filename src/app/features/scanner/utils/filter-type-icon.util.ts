const ICONS: Record<string, string> = {
  ESTATICO: 'bi-database-fill',
  DINAMICO: 'bi-lightning-charge-fill',
  TECNICO: 'bi-cpu-fill',
};

export function getFilterTypeIcon(enumTipoFiltro: string | undefined): string {
  return ICONS[enumTipoFiltro ?? ''] ?? 'bi-tag-fill';
}
