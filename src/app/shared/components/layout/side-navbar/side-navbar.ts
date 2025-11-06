import { Component, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService } from '../../../../core/services/theme/theme.service';
import { I18nService } from '../../../../core/services/i18n/i18n.service';

@Component({
  selector: 'app-side-navbar',
  imports: [MatButton, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './side-navbar.html',
  styleUrl: './side-navbar.scss'
})
export class SideNavbar {
  // Inputs for responsive behavior
  isMobile = input<boolean>(false);
  isBottomNav = input<boolean>(false);
  drawer = input<MatSidenav | null>(null);

  // Inyectar servicios usando inject()
  readonly themeService = inject(ThemeService);
  readonly i18nService = inject(I18nService);

  // Exponer signals para el template
  readonly isDarkMode = this.themeService.isDark;
  readonly currentLocale = this.i18nService.currentLocale;
  readonly currentLocaleInfo = this.i18nService.currentLocaleInfo;

  /**
   * Alterna el tema entre claro y oscuro
   */
  toggleTheme(): void {
    this.themeService.toggle();
  }

  /**
   * Cambia el idioma de la aplicación
   */
  toggleLanguage(): void {
    this.i18nService.toggle();
  }

  /**
   * Obtiene la etiqueta del idioma actual para mostrar
   */
  getCurrentLanguageLabel(): string {
    return this.currentLocaleInfo().name;
  }

  /**
   * Cierra el drawer después de navegar (solo en mobile)
   */
  closeDrawerIfMobile(): void {
    if (this.isMobile() && this.drawer()) {
      this.drawer()!.close();
    }
  }

  /**
   * Abre el drawer con más opciones
   */
  openDrawer(): void {
    if (this.drawer()) {
      this.drawer()!.open();
    }
  }
}
