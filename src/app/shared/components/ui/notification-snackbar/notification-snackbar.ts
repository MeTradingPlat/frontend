import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

// Vive aca (no en notification.service.ts) para que el servicio pueda
// importar este componente sin crear un ciclo -- el servicio depende del
// tipo del componente, nunca al reves.
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationSnackbarData {
  message: string;
  type: NotificationType;
}

// Un icono por tipo -- antes exito/info compartian el mismo color y no
// tenian ninguna forma de distinguirse a simple vista mas que leyendo el
// texto completo.
const ICONS: Record<NotificationType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info'
};

@Component({
  selector: 'app-notification-snackbar',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './notification-snackbar.html',
  styleUrl: './notification-snackbar.scss'
})
export class NotificationSnackbar {
  readonly data = inject<NotificationSnackbarData>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef<NotificationSnackbar>);

  get icon(): string {
    return ICONS[this.data.type];
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
