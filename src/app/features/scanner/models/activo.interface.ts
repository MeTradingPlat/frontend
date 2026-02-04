export interface Activo {
  idActivo: number;
  idEscaner: number;
  nombreEscaner: string;
  symbol: string;
  estado: string;
  fechaDeteccion: string;
  fechaActualizacion: string;
  metadatos?: string;
}

export interface ActivoDTORespuesta {
  idActivo: number;
  idEscaner: number;
  nombreEscaner: string;
  symbol: string;
  estado: string;
  fechaDeteccion: string;
  fechaActualizacion: string;
  metadatos?: string;
}
