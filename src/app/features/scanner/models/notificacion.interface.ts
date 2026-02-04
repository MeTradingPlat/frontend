export interface Notificacion {
  id: string;
  tipo: string;
  nivel: string;
  titulo: string;
  mensaje: string;
  idEscaner?: number;
  symbol?: string;
  categoria: string;
  timestamp: string;
}

export interface NotificacionDTORespuesta {
  id: string;
  tipo: string;
  nivel: string;
  titulo: string;
  mensaje: string;
  idEscaner?: number;
  symbol?: string;
  categoria: string;
  timestamp: string;
}
