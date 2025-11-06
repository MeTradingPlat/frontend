import { Component, ViewChild, signal, effect, inject } from '@angular/core';
import { MatButtonModule } from "@angular/material/button";
import { MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { RouterOutlet } from '@angular/router';
import { SideNavbar } from './shared/components/layout/side-navbar/side-navbar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SideNavbar,
    MatButtonModule,
    MatSidenavModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  @ViewChild('drawer') drawer!: MatSidenav;

  private breakpointObserver = inject(BreakpointObserver);

  // Signal to track if we're on mobile (max-width: 768px)
  isMobile = toSignal(
    this.breakpointObserver.observe(['(max-width: 768px)'])
  );

  isHandset = signal(false);

  constructor() {
    effect(() => {
      this.isHandset.set(this.isMobile()?.matches || false);
    });
  }

  toggleDrawer(): void {
    if (this.drawer) {
      this.drawer.toggle();
    }
  }
}
