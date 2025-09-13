import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerSidebarButton } from '../scanner-sidebar-button/scanner-sidebar-button';

enum EnumEstadoEscaner {
    ARCHIVADO = 'ARCHIVADO',
    INICIADO = 'INICIADO',
    DETENIDO = 'DETENIDO',
}

interface SidebarItem {
  iconClass: string;
  buttonText: string;
}

@Component({
  selector: 'app-scanner-info',
  standalone: true,
  imports: [CommonModule, ScannerSidebarButton],
  templateUrl: './scanner-info.html',
  styleUrl: './scanner-info.css'
})

export class ScannerInfo {
  public EnumEstadoEscaner = EnumEstadoEscaner; // Make the enum available in the template
  @Input() title: string = '';
  @Input() estado: EnumEstadoEscaner = EnumEstadoEscaner.ARCHIVADO;
  @Input() idScanner: number = 0; // Default to 0 or a suitable initial value

  sidebarItems: SidebarItem[] = [
    { iconClass: 'bi bi-activity', buttonText: $localize `Señales` },
    { iconClass: 'bi bi-graph-up', buttonText: $localize `Activos` },
    { iconClass: 'bi bi-newspaper', buttonText: $localize `Noticias` },
    { iconClass: 'bi bi-clock-history', buttonText: $localize `Registro` },
    { iconClass: 'bi bi-sliders', buttonText: $localize `Filtros` },
  ];

  selectedSidebarItem: string = $localize `Señales`; // Default selected item

  onSidebarButtonClick(itemText: string) {
    this.selectedSidebarItem = itemText;
    // Here you would call a function to load content based on the selected item
    console.log(`Sidebar item clicked: ${itemText}`);
  }
}
