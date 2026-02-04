export interface RegistroLog {
  idRegistroLog: number;
  servicioOrigen: string;
  nivel: string;
  mensaje: string;
  idEscaner?: number;
  symbol?: string;
  categoria: string;
  timestamp: string;
  metadatos?: string;
}

export interface RegistroLogDTORespuesta {
  idRegistroLog: number;
  servicioOrigen: string;
  nivel: string;
  mensaje: string;
  idEscaner?: number;
  symbol?: string;
  categoria: string;
  timestamp: string;
  metadatos?: string;
}
