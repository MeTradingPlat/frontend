export type TipoNotificacion = 'LOG' | 'SIGNAL' | 'ORDER' | 'ALERT' | 'SCANNER_STATE';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  nivel: string;
  titulo: string;
  mensaje: string;
  idEscaner?: number;
  symbol?: string;
  categoria: string;
  timestamp: string;
  metadatos?: string;
}

export interface NotificacionDTORespuesta {
  id: string;
  tipo: TipoNotificacion;
  nivel: string;
  titulo: string;
  mensaje: string;
  idEscaner?: number;
  symbol?: string;
  categoria: string;
  timestamp: string;
  metadatos?: string;
}

export interface MetadatosEstadoEscaner {
  estadoAnterior: string;
  estadoNuevo: string;
  razon: string;
}
