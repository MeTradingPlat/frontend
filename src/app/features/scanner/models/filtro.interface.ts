import { Categoria, CategoriaDTORespuesta } from "./categoria.interface";
import { Parametro, ParametroDTOPeticion, ParametroDTORespuesta } from "./parametro.interface";

export interface Filtro{
    enumFiltro: string;
    etiquetaNombre?: string;
    etiquetaDescripcion?: string;
    objCategoria?: Categoria;
    parametros: Parametro[];
    enumTipoFiltro?: string;
    etiquetaTipoFiltro?: string;
}

export interface FiltroDtoRespuesta {
    enumFiltro: string;
    etiquetaNombre: string;
    etiquetaDescripcion: string;
    objCategoria: CategoriaDTORespuesta;
    parametros: ParametroDTORespuesta[];
    enumTipoFiltro?: string;
    etiquetaTipoFiltro?: string;
}

export interface FiltroDtoPeticion {
    enumFiltro: string;
    parametros: ParametroDTOPeticion[];
}