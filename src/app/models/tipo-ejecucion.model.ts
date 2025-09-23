import { EnumTipoEjecucion } from "../enums/enum-tipo-ejecucion";

export interface TipoEjecucionDTOPeticion {
    enumTipoEjecucion: EnumTipoEjecucion;
}

export interface TipoEjecucionDTORespuesta {
    etiqueta: string;
    enumTipoEjecucion: EnumTipoEjecucion;
}