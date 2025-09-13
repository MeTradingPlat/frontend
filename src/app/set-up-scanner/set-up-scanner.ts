import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SecondNavbar } from '../second-navbar/second-navbar';
import { filter } from 'rxjs/operators';

interface NavItem {
  path: string;
  iconClass: string;
  buttonText: string;
}

@Component({
  selector: 'app-set-up-scanner',
  standalone: true,
  imports: [CommonModule, SecondNavbar],
  templateUrl: './set-up-scanner.html',
  styleUrl: './set-up-scanner.css'
})
export class SetUpScanner implements OnInit {
  scannerId: string | null = null;
  title: string = '';
  navItems: NavItem[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.initializeView();
    });
    this.initializeView(); // Initial call in case of direct navigation
  }

  initializeView() {
    this.scannerId = this.route.snapshot.paramMap.get('id');
    if (this.scannerId) {
      this.title = $localize `Escáner: ${this.scannerId}`;
      this.navItems = [
        { path: '/escaner', iconClass: 'bi bi-arrow-left', buttonText: $localize `Atrás` },
        { path: '', iconClass: 'bi bi-archive', buttonText: $localize `Archivar` },
        { path: '', iconClass: 'bi bi-trash-fill', buttonText: $localize `Borrar` },
      ];
    } else {
      this.title = $localize `Nuevo Escáner`;
      this.navItems = [
        { path: '/escaner', iconClass: 'bi bi-arrow-left', buttonText: $localize `Atrás` },
        { path: '', iconClass: 'bi bi-download-fill', buttonText: $localize `Guardar` },
        { path: '', iconClass: 'bi bi-archive', buttonText: $localize `Archivar` },
      ];
    }
  }

  onNavbarButtonClick(buttonText: string) {
    if (buttonText === 'Atrás') {
      this.router.navigate(['/escaner']);
    } else {
      console.log(`${buttonText} clicked`);
      // Implement save, archive, delete logic here
    }
  }
}
