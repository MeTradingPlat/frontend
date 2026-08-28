import { RegistroLog } from '../models/registro-log.interface';

export interface GroupedRegistroLog extends RegistroLog {
  isGroupHeader?: boolean;
  groupCount?: number;
  groupMinuteKey?: string;
  groupExpanded?: boolean;
}

const MINUTE_KEY_LENGTH = 16; // 'YYYY-MM-DDTHH:MM'

/**
 * Colapsa SIGNAL consecutivas del mismo minuto en una sola fila resumen
 * ("N señales en este minuto") -- sin esto un escaner activo satura el
 * registro con una chorrera de filas identicas en vez de un resumen legible.
 * Solo agrupa si hay MAS de una en el mismo minuto; una sola se muestra
 * normal, y las categorias que no son SIGNAL nunca se agrupan.
 */
export function groupSignalLogs(rows: RegistroLog[], expandedMinutes: ReadonlySet<string>): GroupedRegistroLog[] {
  const result: GroupedRegistroLog[] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (row.categoria !== 'SIGNAL') {
      result.push(row);
      i++;
      continue;
    }
    const minuteKey = row.timestamp.slice(0, MINUTE_KEY_LENGTH);
    const group: RegistroLog[] = [row];
    let j = i + 1;
    while (j < rows.length && rows[j].categoria === 'SIGNAL' && rows[j].timestamp.slice(0, MINUTE_KEY_LENGTH) === minuteKey) {
      group.push(rows[j]);
      j++;
    }
    if (group.length === 1) {
      result.push(row);
    } else {
      const expanded = expandedMinutes.has(minuteKey);
      result.push({ ...row, isGroupHeader: true, groupCount: group.length, groupMinuteKey: minuteKey, groupExpanded: expanded });
      if (expanded) {
        for (const signal of group) result.push({ ...signal });
      }
    }
    i = j;
  }
  return result;
}
