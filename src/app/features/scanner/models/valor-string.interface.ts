import { Valor, ValorDTOPeticion, ValorDTORespuesta } from "./valor.interface";

export interface ValorString extends Valor {
    valor: string;
}

export interface ValorStringDTORespuesta extends ValorDTORespuesta {
    valor: string;
}

export interface ValorStringDTOPeticion extends ValorDTOPeticion {
    valor: string;
}