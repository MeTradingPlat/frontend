import { EnumFiltro } from "../enums/enum-filtro";
import { CategoriaDTORespuesta } from "./categoria.model";
import { ParametroDTORespuesta } from "./parametro.model";

export interface FiltroDtoRespuesta {
    enumFiltro: EnumFiltro;
    etiquetaNombre: string;
    etiquetaDescripcion: string;
    objCategoria: CategoriaDTORespuesta;
    parametros: ParametroDTORespuesta[];
}