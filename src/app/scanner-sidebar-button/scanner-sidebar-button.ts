import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scanner-sidebar-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scanner-sidebar-button.html',
  styleUrl: './scanner-sidebar-button.css'
})
export class ScannerSidebarButton {
  @Input() iconClass: string = '';
  @Input() buttonText: string = '';
  @Input() isSelected: boolean = false;
  @Output() buttonClicked = new EventEmitter<string>();

  onClick() {
    this.buttonClicked.emit(this.buttonText);
  }
}
