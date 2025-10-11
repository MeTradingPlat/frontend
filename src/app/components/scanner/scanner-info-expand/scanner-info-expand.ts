import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerInfoItem } from "../scanner-info-item/scanner-info-item";
import { scannerInfoItem } from '../../../models/escaner.model';

@Component({
  selector: 'app-scanner-info-expand',
  standalone: true,
  imports: [CommonModule, ScannerInfoItem],
  templateUrl: './scanner-info-expand.html',
  styleUrl: './scanner-info-expand.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerInfoExpand {
  idScanner = input.required<number>();
  selectedItemId = signal<number>(1);

  sidebarItems: scannerInfoItem[] = [
    {
      id: 1,
      iconClass: 'bi bi-activity',
      buttonText: $localize`Señales`,
      action: () => console.log('Señales clicked')
    },
    {
      id: 2,
      iconClass: 'bi bi-graph-up',
      buttonText: $localize`Activos`,
      action: () => console.log('Activos clicked')
    },
    {
      id: 3,
      iconClass: 'bi bi-newspaper',
      buttonText: $localize`Noticias`,
      action: () => console.log('Noticias clicked')
    },
    {
      id: 4,
      iconClass: 'bi bi-clock-history',
      buttonText: $localize`Registro`,
      action: () => console.log('Registro clicked')
    },
    {
      id: 5,
      iconClass: 'bi bi-sliders',
      buttonText: $localize`Filtros`,
      action: () => console.log('Filtros clicked')
    }
  ];

  onSidebarItemClicked(buttonText: string) {
    const clickedItem = this.sidebarItems.find(item => item.buttonText === buttonText);
    if (clickedItem) {
      this.selectedItemId.set(clickedItem.id);
      clickedItem.action();
    }
  }
}
