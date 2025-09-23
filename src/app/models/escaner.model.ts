import { MercadoDTOPeticion, MercadoDTORespuesta } from "./mercado.model";
import { TipoEjecucionDTOPeticion, TipoEjecucionDTORespuesta } from "./tipo-ejecucion.model";
import { EstadoEscanerDTORespuesta } from "./estado-escaner.model";

export interface EscanerDTOPeticion {
    nombre: string;
    descripcion: string;
    horaInicio: string; // Assuming time as string
    horaFin: string;   // Assuming time as string
    objTipoEjecucion: TipoEjecucionDTOPeticion;
    mercados: MercadoDTOPeticion[];
}

export interface EscanerDTORespuesta {
    idEscaner: number;
    nombre: string;
    descripcion: string;
    horaInicio: string;
    horaFin: string;
    fechaCreacion: string; // Assuming date as string
    mercados: MercadoDTORespuesta[];
    objEstado: EstadoEscanerDTORespuesta;
    objTipoEjecucion: TipoEjecucionDTORespuesta;
}

export interface scannerInfoItem {
    id:number,
    iconClass: string;
    buttonText: string;
    action: () => void;
}
