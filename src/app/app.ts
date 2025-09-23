import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarMain } from "./components/navbar/navbar-main/navbar-main";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarMain],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
