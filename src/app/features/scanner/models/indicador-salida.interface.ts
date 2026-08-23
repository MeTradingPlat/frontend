import { Parametro } from "./parametro.interface";
import { ValorDTORespuesta } from "./valor.interface";

/**
 * Indicador de salida (stop loss / take profit) -- catalogo separado de
 * Filtro: no participa en el escaneo de entrada, define un nivel de precio
 * de salida para una posicion ya abierta. Todavia sin persistencia: solo
 * catalogo de solo lectura (nombre, descripcion, parametros configurables).
 */
export interface IndicadorSalida {
    enumIndicadorSalida: string;
    etiquetaNombre?: string;
    etiquetaDescripcion?: string;
    parametros: Parametro[];
}

export interface ParametroIndicadorSalidaDTORespuesta {
    enumParametroIndicadorSalida: string;
    etiqueta: string;
    objValorSeleccionado: ValorDTORespuesta;
    opciones: ValorDTORespuesta[];
}

export interface IndicadorSalidaDtoRespuesta {
    enumIndicadorSalida: string;
    etiquetaNombre: string;
    etiquetaDescripcion: string;
    parametros: ParametroIndicadorSalidaDTORespuesta[];
}
