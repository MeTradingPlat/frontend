import { Component } from '@angular/core';
import { ButtonNavbar } from '../button-navbar/button-navbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main-navbar',
  standalone: true,
  imports: [ButtonNavbar, RouterLink, RouterLinkActive],
  templateUrl: './main-navbar.html',
  styleUrl: './main-navbar.css'
})
export class MainNavbar {
  navItems = [
    {
      path: '/escaner',
      iconClass: 'bi bi-clipboard-data-fill',
      buttonText: $localize `Escáneres`
    },
    {
      path: '/noticias',
      iconClass: 'bi bi-newspaper',
      buttonText: $localize `Noticias`
    }
  ];
}