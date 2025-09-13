import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNavbar } from './main-navbar/main-navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainNavbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fronted-mtp');
}
