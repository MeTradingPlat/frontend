import { Valor, ValorDTOPeticion, ValorDTORespuesta } from "./valor.interface";

export interface ValorFloat extends Valor{
    valor: number;
}

export interface ValorFloatDTORespuesta extends ValorDTORespuesta {
    valor: number;
}

export interface ValorFloatDTOPeticion extends ValorDTOPeticion {
    valor: number;
}