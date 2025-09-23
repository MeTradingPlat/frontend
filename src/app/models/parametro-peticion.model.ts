import { EnumParametro } from "../enums/enum-parametro";
import { ValorDTOPeticion } from "./valor.model"; // This will be updated

export interface ParametroDTOPeticion {
    enumParametro: EnumParametro;
    objValorSeleccionado: ValorDTOPeticion;
}