import { EnumTipoValor } from "../enums/enum-tipo-valor";
import { EnumCondicional } from "../enums/enum-condicional";

export interface ValorDTORespuesta {
    etiqueta: string;
    enumTipoValor: EnumTipoValor;
}

export interface ValorCondicionalDTORespuesta extends ValorDTORespuesta {
    enumCondicional: EnumCondicional;
    valor1: number;
    valor2: number;
}

export interface ValorFloatDTORespuesta extends ValorDTORespuesta {
    valor: number;
}

export interface ValorIntegerDTORespuesta extends ValorDTORespuesta {
    valor: number;
}

export interface ValorStringDTORespuesta extends ValorDTORespuesta {
    valor: string;
}