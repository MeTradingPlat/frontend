const ICONS: Record<string, string> = {
  VOLUMEN: 'bi-bar-chart-fill',
  PRECIO_Y_MOVIMIENTO: 'bi-graph-up-arrow',
  MOMENTUM_E_INDICADORES_TECNICOS: 'bi-speedometer2',
  CARACTERISTICAS_FUNDAMENTALES: 'bi-building',
  TIEMPO_Y_PATRONES_DE_PRECIO: 'bi-clock-history',
};

export function getCategoryFilterIcon(enumCategoriaFiltro: string): string {
  return ICONS[enumCategoriaFiltro] ?? 'bi-funnel-fill';
}
