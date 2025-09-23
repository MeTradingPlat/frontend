import { Component } from '@angular/core';
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
export class NavbarMain {
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
}
