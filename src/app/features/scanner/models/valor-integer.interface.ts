import { Valor, ValorDTOPeticion, ValorDTORespuesta } from "./valor.interface";

export interface ValorInteger extends Valor {
    valor: number;
}

export interface ValorIntegerDTORespuesta extends ValorDTORespuesta {
    valor: number;
}

export interface ValorIntegerDTOPeticion extends ValorDTOPeticion {
    valor: number;
}