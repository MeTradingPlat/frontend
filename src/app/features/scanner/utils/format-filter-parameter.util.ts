import { Filtro } from '../models/filtro.interface';

export interface FilterParamView {
  etiqueta: string;
  valor: string;
}

/**
 * El backend ya interpola valor1/valor2 dentro de `etiqueta` para
 * CONDICIONAL (ver FuenteMensajesImplAdapter#internacionalizarValor) --
 * solo INTEGER/FLOAT necesitan leer el numero crudo aparte.
 */
export function formatFilterParameters(filtro: Filtro): FilterParamView[] {
  if (!filtro.parametros || filtro.parametros.length === 0) return [];

  return filtro.parametros.map(param => {
    const valor = param.objValorSeleccionado;
    if (!valor) return { etiqueta: param.etiqueta, valor: '-' };

    if (valor.enumTipoValor === 'INTEGER' || valor.enumTipoValor === 'FLOAT') {
      return { etiqueta: param.etiqueta, valor: String((valor as any).valor) };
    }
    return { etiqueta: param.etiqueta, valor: valor.etiqueta };
  });
}
