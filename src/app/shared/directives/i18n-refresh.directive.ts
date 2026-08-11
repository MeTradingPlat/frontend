import { ChangeDetectorRef, Directive, effect, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n/i18n.service';

/**
 * En componentes OnPush, el pipe `translate` no re-renderiza solo al cambiar
 * de idioma -- ngx-translate avisa via un Subject de RxJS, no una signal, y
 * en esta app zoneless nada dispara un chequeo de cambios sin una signal o
 * un evento de por medio (confirmado: los formularios de Configurar Escaner
 * se quedaban en el idioma con el que se abrieron). Agregar esta directiva a
 * cualquier elemento del template fuerza un markForCheck() cada vez que
 * cambia I18nService.currentLocale(), sin tener que inyectar el servicio ni
 * repetir el mismo binding oculto en cada componente.
 */
@Directive({
  selector: '[appI18nRefresh]',
  standalone: true
})
export class I18nRefreshDirective {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      this.i18n.currentLocale();
      this.cdr.markForCheck();
    });
  }
}
