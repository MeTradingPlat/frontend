import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-navbar.html',
  styleUrl: './button-navbar.css'
})
export class ButtonNavbar {
  @Input() isSelected: boolean = false;
  @Input() iconClass: string = '';
  @Input() buttonText: string = '';
}