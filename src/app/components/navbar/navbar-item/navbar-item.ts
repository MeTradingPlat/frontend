import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core'; // Importar input y output
import { NavMenuItem } from '../../../models/navbar.model';

@Component({
  selector: 'app-navbar-item',
  standalone: true, // Asegurarse de que sea standalone
  imports: [CommonModule],
  templateUrl: './navbar-item.html',
  styleUrl: './navbar-item.css'
})
export class NavbarItem {
  item = input.required<NavMenuItem>();
  isSelected = input<boolean>(false);
  clickEvent = output<void>();
}
