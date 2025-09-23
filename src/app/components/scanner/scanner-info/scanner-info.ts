import { Component, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router
import { EnumEstadoEscaner } from '../../../enums/enum-estado-escaner';
import { scannerInfoItem } from '../../../models/escaner.model';
import { ScannerInfoItem } from "../scanner-info-item/scanner-info-item";

@Component({
  selector: 'app-scanner-info',
  standalone: true,
  imports: [CommonModule, ScannerInfoItem],
  templateUrl: './scanner-info.html',
  styleUrl: './scanner-info.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerInfo {
  private router = inject(Router); // Inject Router

  title = input.required<string>();
  estado = input<EnumEstadoEscaner>(EnumEstadoEscaner.DETENIDO);
  idScanner = input.required<number>();

  stateChange = output<EnumEstadoEscaner>();
  configure = output<number>();

  // Expose the enum to the template
  EnumEstadoEscaner = EnumEstadoEscaner;

  selectedItemId: number = 1; // Initialize with the first item selected

  toggleScannerState() {
    const newState = this.estado() === EnumEstadoEscaner.INICIADO 
      ? EnumEstadoEscaner.DETENIDO 
      : EnumEstadoEscaner.INICIADO;
    this.stateChange.emit(newState);
  }
  
  navigateToConfiguration(id: number) {
    this.router.navigate(['/escaner/configuracion', id]);
  }

  onSidebarItemClicked(buttonText: string) {
    const clickedItem = this.sidebarItems.find(item => item.buttonText === buttonText);
    if (clickedItem) {
      this.selectedItemId = clickedItem.id;
      // Execute the action associated with the clicked item
      clickedItem.action();
    }
  }

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
}
