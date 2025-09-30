import { Component, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router
import { EnumEstadoEscaner } from '../../../enums/enum-estado-escaner';
import { scannerInfoItem } from '../../../models/escaner.model';
import { ScannerInfoItem } from "../scanner-info-item/scanner-info-item";
import { EstadoEscanerService } from '../../../services/estado-escaner.service'; // Import EstadoEscanerService

@Component({
  selector: 'app-scanner-info',
  standalone: true,
  imports: [CommonModule, ScannerInfoItem],
  templateUrl: './scanner-info.html',
  styleUrl: './scanner-info.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerInfo {
  private router = inject(Router);
  private estadoEscanerService = inject(EstadoEscanerService); // Inject EstadoEscanerService

  title = input.required<string>();
  estado = input<EnumEstadoEscaner>(EnumEstadoEscaner.DETENIDO);
  idScanner = input.required<number>();
  isSelected = input<boolean>(false); // New input for selection state

  stateChange = output<EnumEstadoEscaner>();
  configure = output<number>();
  titleClicked = output<number>(); // New output for title click
  expandClicked = output<number>(); // New output for expand button click

  // Expose the enum to the template
  EnumEstadoEscaner = EnumEstadoEscaner;

  selectedItemId: number = 1; // Initialize with the first item selected

  toggleScannerState() {
    const currentId = this.idScanner();
    if (this.estado() === EnumEstadoEscaner.INICIADO) {
      this.estadoEscanerService.detenerEscaner(currentId).subscribe({
        next: () => this.stateChange.emit(EnumEstadoEscaner.DETENIDO),
        error: (err) => console.error('Error al detener escáner:', err)
      });
    } else if (this.estado() === EnumEstadoEscaner.DETENIDO || this.estado() === EnumEstadoEscaner.DESARCHIVADO) {
      this.estadoEscanerService.iniciarEscaner(currentId).subscribe({
        next: () => this.stateChange.emit(EnumEstadoEscaner.INICIADO),
        error: (err) => console.error('Error al iniciar escáner:', err)
      });
    }
  }
  
  navigateToConfiguration(id: number) {
    this.router.navigate(['/escaner/configuracion', id]);
  }

  navigateToExpand(id: number) {
    this.expandClicked.emit(id);
  }

  onTitleClick(id: number) {
    this.titleClicked.emit(id);
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
