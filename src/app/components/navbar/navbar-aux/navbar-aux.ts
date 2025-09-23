import { Component, input, output } from '@angular/core';
import { NavMenuItem } from '../../../models/navbar.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarItem } from '../navbar-item/navbar-item'; // Importar NavbarItem

@Component({
  selector: 'app-navbar-aux',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarItem], // Añadir NavbarItem
  templateUrl: './navbar-aux.html',
  styleUrl: './navbar-aux.css'
})
export class NavbarAux {
  title = input<string>('');
  backPath = input<string>('');
  items = input<NavMenuItem[]>([]);
  buttonClicked = output<NavMenuItem>();

  get backButtonItem(): NavMenuItem {
    return {
      id: 1,
      path: this.backPath(),
      iconClass: 'bi bi-arrow-left-square-fill',
      buttonText: '',
      action: () => {}
    };
  }

  onButtonClick(item: NavMenuItem) {
    console.log('Button clicked:', item.buttonText);
    this.buttonClicked.emit(item);
  }
  trackByFn(index: number, item: NavMenuItem): number {
    return item.id; // Assuming item.id is unique, otherwise use index
  }
}
