export interface ParsedSignalEvent {
  type: 'signal';
  filters: string[];
}

export interface ParsedScannerEvent {
  type: 'scanner';
  evento: string;
}

/**
 * Extrae de `metadatos` los datos crudos necesarios para armar un mensaje
 * traducido en el template (via el pipe `translate`) -- nunca devuelve texto
 * ya formado, solo los parametros. Si `metadatos` no trae lo esperado (filas
 * viejas sin backfill, o una categoria sin patron definido), devuelve null
 * para que el caller recaiga en el `mensaje` crudo del backend.
 */
export function parseLogEvent(categoria: string, metadatos: string | null | undefined): ParsedSignalEvent | ParsedScannerEvent | null {
  if (!metadatos) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(metadatos);
  } catch {
    return null;
  }

  if (categoria === 'SIGNAL' && Array.isArray(parsed.matches)) {
    const filters = [...new Set(parsed.matches.map((m: { filtro: string }) => m.filtro))] as string[];
    return { type: 'signal', filters };
  }

  if (categoria === 'SCANNER' && typeof parsed.evento === 'string') {
    return { type: 'scanner', evento: parsed.evento };
  }

  return null;
}
