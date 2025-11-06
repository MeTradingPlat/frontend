import { EstadoEscaner, EstadoEscanerDTORespuesta } from "./estado-escaner.interface";
import { Mercado, MercadoDTOPeticion, MercadoDTORespuesta } from "./mercado.interface";
import { TipoEjecucion, TipoEjecucionDTOPeticion, TipoEjecucionDTORespuesta } from "./tipo-ejecucion.interface";

export interface Escaner {
    idEscaner?: number;
    nombre: string;
    descripcion: string;
    horaInicio: string;
    horaFin: string;
    fechaCreacion?: string;
    mercados: Mercado[];
    objEstado?: EstadoEscaner;
    objTipoEjecucion: TipoEjecucion;
}

export interface EscanerDTOPeticion {
    nombre: string;
    descripcion: string;
    horaInicio: string;
    horaFin: string;
    mercados: MercadoDTOPeticion[];
    objTipoEjecucion: TipoEjecucionDTOPeticion;
}

export interface EscanerDTORespuesta {
    idEscaner: number;
    nombre: string;
    descripcion: string;
    horaInicio: string;
    horaFin: string;
    fechaCreacion: string;
    mercados: MercadoDTORespuesta[];
    objEstado: EstadoEscanerDTORespuesta;
    objTipoEjecucion: TipoEjecucionDTORespuesta;
}