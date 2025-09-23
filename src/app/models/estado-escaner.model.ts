import { EnumEstadoEscaner } from "../enums/enum-estado-escaner";

export interface EstadoEscanerDTORespuesta {
    enumEstadoEscaner: EnumEstadoEscaner;
    fechaRegistro: string; // Assuming date as string for simplicity, can be Date object
}