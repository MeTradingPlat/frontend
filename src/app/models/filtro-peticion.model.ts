import { EnumFiltro } from "../enums/enum-filtro";
import { ParametroDTOPeticion } from "./parametro-peticion.model"; // This will be created next

export interface FiltroDtoPeticion {
    enumFiltro: EnumFiltro;
    parametros: ParametroDTOPeticion[];
}