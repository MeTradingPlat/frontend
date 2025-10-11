import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { scannerInfoItem } from '../../../models/escaner.model';

@Component({
  selector: 'app-scanner-info-item',
  standalone: true,
  imports: [],
  templateUrl: './scanner-info-item.html',
  styleUrl: './scanner-info-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerInfoItem {
  item = input.required<scannerInfoItem>();
  isSelected = input<boolean>(false);
  isExpandedView = input<boolean>(false); // New input for expanded view
  buttonClicked = output<string>();

  onClick() {
    this.buttonClicked.emit(this.item().buttonText);
  }
}
