import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonNavbar } from "../button-navbar/button-navbar";

interface ButtonItem {
  path: string;
  iconClass: string;
  buttonText: string;
}

@Component({
  selector: 'app-second-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonNavbar],
  templateUrl: './second-navbar.html',
  styleUrl: './second-navbar.css'
})
export class SecondNavbar {
  @Input() title: string = '';
  @Input() backPath: string = '';
  @Input() items: ButtonItem[] = [];
  @Output() buttonClicked = new EventEmitter<string>();

  onButtonClick(buttonText: string) {
    this.buttonClicked.emit(buttonText);
  }
}
