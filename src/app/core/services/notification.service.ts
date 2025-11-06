import { Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private nextId = 0;
  public notifications = signal<Notification[]>([]);

  /**
   * Muestra una notificación de éxito.
   * @param message El mensaje a mostrar.
   */
  success(message: string): void {
    this.addNotification(message, 'success');
  }

  /**
   * Muestra una notificación de error.
   * @param message El mensaje a mostrar.
   */
  error(message: string): void {
    this.addNotification(message, 'error');
  }

  /**
   * Muestra una notificación de información.
   * @param message El mensaje a mostrar.
   */
  info(message: string): void {
    this.addNotification(message, 'info');
  }

  /**
   * Muestra una notificación de advertencia.
   * @param message El mensaje a mostrar.
   */
  warning(message: string): void {
    this.addNotification(message, 'warning');
  }

  private addNotification(message: string, type: Notification['type']): void {
    const newNotification: Notification = {
      id: this.nextId++,
      message,
      type
    };
    this.notifications.update(currentNotifications => [...currentNotifications, newNotification]);

    // Opcional: Remover la notificación después de un tiempo
    setTimeout(() => this.removeNotification(newNotification.id), 5000);
  }

  /**
   * Elimina una notificación por su ID.
   * @param id El ID de la notificación a eliminar.
   */
  removeNotification(id: number): void {
    this.notifications.update(currentNotifications =>
      currentNotifications.filter(notification => notification.id !== id)
    );
  }
}
