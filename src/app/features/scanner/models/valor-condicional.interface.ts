import { Valor, ValorDTOPeticion, ValorDTORespuesta } from "./valor.interface";

export interface ValorCondicional extends Valor{
    enumCondicional: string;
    isInteger: boolean;
    valor1: number;
    valor2?: number;
}

export interface ValorCondicionalDTORespuesta extends ValorDTORespuesta {
    enumCondicional: string;
    isInteger: boolean;
    valor1: number;
    valor2?: number;
}

export interface ValorCondicionalDTOPeticion extends ValorDTOPeticion {
    enumCondicional: string;
    valor1: number;
    valor2?: number;
}