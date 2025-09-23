import { EnumMercado } from "../enums/enum-mercado";

export interface MercadoDTOPeticion {
    enumMercado: EnumMercado;
}

export interface MercadoDTORespuesta {
    etiqueta: string;
    enumMercado: EnumMercado;
}