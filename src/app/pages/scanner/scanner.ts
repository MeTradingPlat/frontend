import { ChangeDetectionStrategy } from '@angular/core';
import { signal } from '@angular/core';
import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router'; // Import Router
import { NavMenuItem } from '../../models/navbar.model';
import { NavbarAux } from '../../components/navbar/navbar-aux/navbar-aux';
import { ScannerInfo } from '../../components/scanner/scanner-info/scanner-info';
import { EscanerDTORespuesta } from '../../models/escaner.model';
import { EnumEstadoEscaner } from '../../enums/enum-estado-escaner';
import { EnumTipoEjecucion } from '../../enums/enum-tipo-ejecucion';
import { EscanerService } from '../../services/escaner.service';
import { EstadoEscanerService } from '../../services/estado-escaner.service'; // Import EstadoEscanerService

@Component({
  selector: 'app-scanner',
  
  imports: [CommonModule, NavbarAux, ScannerInfo],
  templateUrl: './scanner.html',
  
  styleUrl: './scanner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scanner implements OnInit {
  private router = inject(Router); 
  private escanerService = inject(EscanerService);
  private estadoEscanerService = inject(EstadoEscanerService); // Inject EstadoEscanerService

  title = 'Escáneres';
  navItems = signal<NavMenuItem[]>([]); // Make navItems a signal
  
  filteredScanners = signal<EscanerDTORespuesta[]>([]);
  selectedScanner = signal<EscanerDTORespuesta | null>(null); // New signal for selected scanner

  ngOnInit(): void {
    this.escanerService.getEscaneres().subscribe(scanners => {
      this.filteredScanners.set(scanners);
      this.updateNavItemsForDefault(); // Set default nav items on init
    });
  }

  updateNavItemsForDefault() {
    this.navItems.set([
      {
        id: 1,
        path:'',
        iconClass: 'bi bi-archive-fill',
        buttonText: $localize`Archivados`,
        action: () => this.router.navigate(['/escaner/archivados']),
      },
      {
        id: 2,
        path:'',
        iconClass: 'bi bi-plus-circle-fill',
        buttonText: $localize`Nuevo`,
        action: () => this.router.navigate(['/escaner/nuevo']), 
      },
    ]);
    this.title = 'Escáneres';
  }

  updateNavItemsForScanner(scanner: EscanerDTORespuesta) {
    const newNavItems: NavMenuItem[] = [];
    
    // Start/Stop button
    if (scanner.objEstado.enumEstadoEscaner === EnumEstadoEscaner.DETENIDO || scanner.objEstado.enumEstadoEscaner === EnumEstadoEscaner.DESARCHIVADO) {
      newNavItems.push({
        id: 1,
        path: '',
        iconClass: 'bi bi-play-fill',
        buttonText: $localize`Iniciar`,
        action: () => this.onScannerStateChange(scanner.idEscaner, EnumEstadoEscaner.INICIADO),
        buttonClass: 'btn btn-success' // Bootstrap class for success button
      });
    } else if (scanner.objEstado.enumEstadoEscaner === EnumEstadoEscaner.INICIADO) {
      newNavItems.push({
        id: 1,
        path: '',
        iconClass: 'bi bi-stop-fill',
        buttonText: $localize`Detener`,
        action: () => this.onScannerStateChange(scanner.idEscaner, EnumEstadoEscaner.DETENIDO),
        buttonClass: 'btn btn-danger' // Bootstrap class for danger button
      });
    }

    // Configure button
    newNavItems.push({
      id: 2,
      path: '',
      iconClass: 'bi bi-gear-fill',
      buttonText: $localize`Configurar`,
      action: () => this.router.navigate(['/escaner/configuracion', scanner.idEscaner]),
      buttonClass: 'btn btn-info' // Bootstrap class for info button
    });

    // Expand button
    newNavItems.push({
      id: 3,
      path: '',
      iconClass: 'bi bi-fullscreen',
      buttonText: $localize`Expandir`,
      action: () => this.router.navigate(['/escaner/expandir', scanner.idEscaner]),
      buttonClass: 'btn btn-secondary' // Bootstrap class for secondary button
    });

    this.navItems.set(newNavItems);
    this.title = scanner.nombre;
  }

  onNavButtonClicked(item: NavMenuItem) {
    console.log('Botón de navegación clicado:', item.buttonText);
    if (item.action) {
      item.action();
    }
  }

  onScannerTitleClicked(idScanner: number) {
    if (this.selectedScanner()?.idEscaner === idScanner) {
      // If the same scanner is clicked again, deselect it
      this.deselectScanner();
    } else {
      const scanner = this.filteredScanners().find(s => s.idEscaner === idScanner);
      if (scanner) {
        this.selectedScanner.set(scanner);
        this.updateNavItemsForScanner(scanner);
      }
    }
  }

  deselectScanner() {
    this.selectedScanner.set(null);
    this.updateNavItemsForDefault();
  }

  onContentClick(event: Event) {
    // Deselect scanner if the click is on the content area and not on a scanner-info card
    const target = event.target as HTMLElement;
    if (!target.closest('app-scanner-info')) {
      this.deselectScanner();
    }
  }

  onScannerExpandClicked(idScanner: number) {
    this.router.navigate(['/escaner/expandir', idScanner]);
  }

  onScannerStateChange(idScanner: number, newState: EnumEstadoEscaner) {
    // Update the state in the filteredScanners signal
    this.filteredScanners.update(scanners => 
      scanners.map(s => s.idEscaner === idScanner ? { ...s, objEstado: { ...s.objEstado, enumEstadoEscaner: newState } } : s)
    );

    // If the selected scanner is the one whose state changed, update its nav items
    if (this.selectedScanner()?.idEscaner === idScanner) {
      const updatedScanner = this.filteredScanners().find(s => s.idEscaner === idScanner);
      if (updatedScanner) {
        this.selectedScanner.set(updatedScanner);
        this.updateNavItemsForScanner(updatedScanner);
      }
    }
  }
}
