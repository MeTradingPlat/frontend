import { Component, inject, OnInit } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { NavMenuItem } from '../../../models/navbar.model';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavbarItem } from "../navbar-item/navbar-item";


@Component({
  selector: 'app-navbar-main',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NavbarItem],
  templateUrl: './navbar-main.html',
  styleUrl: './navbar-main.css'
})
export class NavbarMain implements OnInit {
  themeService = inject(ThemeService);

  navUpItems: NavMenuItem[] = [
     {
      id: 1,
      path: '/inicio',
      iconClass: 'bi bi-house-fill',
      buttonText: $localize `Inicio`,
      action: () => {}
    },
    {
      id: 2,
      path: '/escaner',
      iconClass: 'bi bi-clipboard-data-fill',
      buttonText: $localize `Escáneres`,
      action: () => {}
    },
    {
      id: 3,
      path: '/noticias',
      iconClass: 'bi bi-newspaper',
      buttonText: $localize `Noticias`,
      action: () => {}
    }
  ];

  navDownItems: NavMenuItem[] = [
    {
      id: 4,
      path: '', // No path for a button that triggers an action
      iconClass: '', // Will be set dynamically based on theme
      buttonText: '', // Will be set dynamically based on theme
      action: () => this.toggleTheme()
    }
  ];

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.updateThemeButtonText();
  }

  updateThemeButtonText(): void {
    const themeButton = this.navDownItems.find(item => item.id === 4);
    if (themeButton) {
      themeButton.iconClass = this.themeService.isDarkMode() ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
      themeButton.buttonText = this.themeService.isDarkMode() ? $localize `Claro` : $localize `Oscuro`;
    }
  }

  ngOnInit(): void {
    this.updateThemeButtonText();
  }
}
