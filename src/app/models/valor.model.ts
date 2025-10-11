import { EnumTipoValor } from "../enums/enum-tipo-valor";
import { EnumCondicional } from "../enums/enum-condicional";

export interface ValorDTOPeticion {
    enumTipoValor: EnumTipoValor;
}

export interface ValorIntegerDTOPeticion extends ValorDTOPeticion {
    valor: number;
}

export interface ValorFloatDTOPeticion extends ValorDTOPeticion {
    valor: number;
}

export interface ValorStringDTOPeticion extends ValorDTOPeticion {
    valor: string;
}

export interface ValorCondicionalDTOPeticion extends ValorDTOPeticion {
    enumCondicional: EnumCondicional;
    valor1: number;
    valor2?: number; // Opcional
}

export interface ValorDTORespuesta {
    etiqueta: string;
    enumTipoValor: EnumTipoValor;
}

export interface ValorCondicionalDTORespuesta extends ValorDTORespuesta {
    enumCondicional: EnumCondicional;
    valor1: number;
    valor2?: number;
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