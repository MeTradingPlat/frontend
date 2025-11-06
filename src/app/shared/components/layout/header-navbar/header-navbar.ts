import { Component, input, output } from '@angular/core';
import { NavbarButton } from '../../../models/interface/navbar-button.interface';
import { RouterLink } from "@angular/router";
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-header-navbar',
  standalone: true,
  imports: [RouterLink, MatButton],
  templateUrl: './header-navbar.html',
  styleUrl: './header-navbar.scss'
})
export class HeaderNavbar {
  backPath = input<string>('');
  title = input<string>('');
  buttons = input<NavbarButton[]>([]);
  action = output<string>();
}
