import { EnumParametro } from "../enums/enum-parametro";
import { ValorDTORespuesta } from "./valor.model";

export interface ParametroDTORespuesta {
    enumParametro: EnumParametro;
    etiqueta: string;
    objValorSeleccionado: ValorDTORespuesta;
    opciones: ValorDTORespuesta[];
}