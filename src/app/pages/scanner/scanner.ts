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

@Component({
  selector: 'app-scanner',
  
  imports: [CommonModule, NavbarAux, ScannerInfo],
  templateUrl: './scanner.html',
  
  styleUrl: './scanner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scanner implements OnInit {
  private router = inject(Router); 

  title = 'Escáneres';
  readonly navItems: NavMenuItem[] = [
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
  ];

  filteredScanners = signal<EscanerDTORespuesta[]>([]);

  private escanerService = inject(EscanerService);

  ngOnInit(): void {
    this.escanerService.getEscaneres().subscribe(scanners => {
      this.filteredScanners.set(scanners);
    });
  }

  onNavButtonClicked(item: NavMenuItem) {
    console.log('Botón de navegación clicado:', item.buttonText);
    if (item.action) {
      item.action();
    }
  }
}
