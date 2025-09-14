import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecondNavbar } from "../second-navbar/second-navbar";
import { ScannerInfo, EnumEstadoEscaner } from "../scanner-info/scanner-info"; // Import EnumEstadoEscaner
import { Router } from '@angular/router';

interface ScannerItem {
  idScanner: number;
  title: string;
  estado: EnumEstadoEscaner;
}

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, SecondNavbar, ScannerInfo],
  templateUrl: './scanner.html',
  styleUrl: './scanner.css'
})
export class Scanner {
  title = $localize `Escáneres`;
  public EnumEstadoEscaner = EnumEstadoEscaner; // Make the enum available in the template
  selectedFilter: string = 'archivados'; // Default filter
  
  scanners: ScannerItem[] = [
    { idScanner: 1, title: 'Ejemplo 1', estado: EnumEstadoEscaner.DETENIDO },
    { idScanner: 2, title: 'Ejemplo 2', estado: EnumEstadoEscaner.INICIADO },
    { idScanner: 3, title: 'Ejemplo 3', estado: EnumEstadoEscaner.ARCHIVADO },
  ];

  navItems = [
    {
      path: '/escaner',
      iconClass: 'bi bi-archive-fill',
      buttonText: $localize `Archivados`
    },
    {
      path: '/escaner/nuevo',
      iconClass: 'bi bi-plus-circle-fill',
      buttonText: $localize `Nuevo`
    }
  ];

  constructor(private router: Router) {}

  selectFilter(filter: string) {
    this.selectedFilter = filter;
    if (filter === 'nuevo') {
      this.router.navigate(['/escaner/nuevo']);
    } else {
      // Handle other filters
    }
  }

  filteredScanners(): ScannerItem[] {
    if (this.selectedFilter === 'archivados') {
      return this.scanners.filter(scanner => scanner.estado === EnumEstadoEscaner.ARCHIVADO);
    }
    return this.scanners;
  }
}
