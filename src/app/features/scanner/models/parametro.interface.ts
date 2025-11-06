import { Valor, ValorDTOPeticion, ValorDTORespuesta } from "./valor.interface";
import { ValorInteger, ValorIntegerDTOPeticion, ValorIntegerDTORespuesta } from "./valor-integer.interface";
import { ValorFloat, ValorFloatDTOPeticion, ValorFloatDTORespuesta } from "./valor-float.interface";
import { ValorString, ValorStringDTOPeticion, ValorStringDTORespuesta } from "./valor-string.interface";
import { ValorCondicional, ValorCondicionalDTOPeticion, ValorCondicionalDTORespuesta } from "./valor-condicional.interface";

// Union types para valores tipados
export type ValorTipado = ValorInteger | ValorFloat | ValorString | ValorCondicional;
export type ValorTipadoDTORespuesta = ValorIntegerDTORespuesta | ValorFloatDTORespuesta | ValorStringDTORespuesta | ValorCondicionalDTORespuesta;
export type ValorTipadoDTOPeticion = ValorIntegerDTOPeticion | ValorFloatDTOPeticion | ValorStringDTOPeticion | ValorCondicionalDTOPeticion;

export interface Parametro {
    enumParametro: string;
    etiqueta: string;
    objValorSeleccionado: ValorTipado;
    opciones: ValorTipado[];
}

export interface ParametroDTORespuesta {
    enumParametro: string;
    etiqueta: string;
    objValorSeleccionado: ValorDTORespuesta;
    opciones: ValorDTORespuesta[];
}

export interface ParametroDTOPeticion {
    enumParametro: string;
    objValorSeleccionado: ValorDTOPeticion;
}
