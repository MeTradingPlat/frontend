import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Servicio centralizado para mostrar notificaciones usando Material Snackbar
 * Sigue las mejores prácticas de UX para notificaciones no-bloqueantes
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom'
  };

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Muestra un mensaje de advertencia
   */
  showWarning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Muestra un mensaje informativo
   */
  showInfo(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Método genérico para mostrar notificaciones
   */
  private show(message: string, type: NotificationType, duration: number): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration,
      panelClass: [`snackbar-${type}`]
    };

    this.snackBar.open(message, 'X', config);
  }

  /**
   * Cierra la notificación actual
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
