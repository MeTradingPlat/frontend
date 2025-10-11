import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarAux } from '../../components/navbar/navbar-aux/navbar-aux';
import { NavMenuItem } from '../../models/navbar.model';
import { EscanerService } from '../../services/escaner.service';
import { EscanerDTORespuesta } from '../../models/escaner.model';
import { ScannerInfoExpand } from '../../components/scanner/scanner-info-expand/scanner-info-expand';
import { EnumEstadoEscaner } from '../../enums/enum-estado-escaner';
import { EstadoEscanerService } from '../../services/estado-escaner.service';
import { FilterAddCard } from '../../components/filter/filter-add-card/filter-add-card';

@Component({
  selector: 'app-scanner-expand',
  standalone: true,
  imports: [CommonModule, NavbarAux, ScannerInfoExpand],
  templateUrl: './scanner-expand.html',
  styleUrl: './scanner-expand.css'
})
export class ScannerExpand implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private escanerService = inject(EscanerService);
  private estadoEscanerService = inject(EstadoEscanerService);

  title = signal<string>('');
  navItems = signal<NavMenuItem[]>([]);
  idScanner = signal<number>(0);
  currentScanner = signal<EscanerDTORespuesta | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.idScanner.set(id);
        this.escanerService.getEscanerById(id).subscribe((scanner: EscanerDTORespuesta) => {
          this.currentScanner.set(scanner);
          this.title.set(scanner.nombre);
          this.updateNavItemsForExpand(scanner);
        });
      }
    });
  }

  updateNavItemsForExpand(scanner: EscanerDTORespuesta) {
    const newNavItems: NavMenuItem[] = [];

    // Start/Stop button
    if (scanner.objEstado.enumEstadoEscaner === EnumEstadoEscaner.DETENIDO || scanner.objEstado.enumEstadoEscaner === EnumEstadoEscaner.DESARCHIVADO) {
      newNavItems.push({
        id: 1,
        path: '',
        iconClass: 'bi bi-play-fill',
        buttonText: $localize`Iniciar`,
        action: () => this.onScannerStateChange(scanner.idEscaner, EnumEstadoEscaner.INICIADO),
        buttonClass: 'btn btn-success'
      });
    } else if (scanner.objEstado.enumEstadoEscaner === EnumEstadoEscaner.INICIADO) {
      newNavItems.push({
        id: 1,
        path: '',
        iconClass: 'bi bi-stop-fill',
        buttonText: $localize`Detener`,
        action: () => this.onScannerStateChange(scanner.idEscaner, EnumEstadoEscaner.DETENIDO),
        buttonClass: 'btn btn-danger'
      });
    }

    // Configure button
    newNavItems.push({
      id: 2,
      path: '',
      iconClass: 'bi bi-gear-fill',
      buttonText: $localize`Configurar`,
      action: () => this.router.navigate(['/escaner/configuracion', scanner.idEscaner]),
      buttonClass: 'btn btn-info'
    });

    this.navItems.set(newNavItems);
  }

  onNavButtonClicked(item: NavMenuItem) {
    console.log('Botón de navegación clicado:', item.buttonText);
    if (item.action) {
      item.action();
    }
  }

  onScannerStateChange(idScanner: number, newState: EnumEstadoEscaner) {
    if (newState === EnumEstadoEscaner.INICIADO) {
      this.estadoEscanerService.iniciarEscaner(idScanner).subscribe({
        next: () => {
          const currentScanner = this.currentScanner();
          if (currentScanner && currentScanner.idEscaner === idScanner) {
            this.currentScanner.set({ ...currentScanner, objEstado: { ...currentScanner.objEstado, enumEstadoEscaner: newState } });
            this.updateNavItemsForExpand(this.currentScanner()!); // Added non-null assertion
          }
        },
        error: (err) => console.error('Error al iniciar escáner:', err)
      });
    } else if (newState === EnumEstadoEscaner.DETENIDO) {
      this.estadoEscanerService.detenerEscaner(idScanner).subscribe({
        next: () => {
          const currentScanner = this.currentScanner();
          if (currentScanner && currentScanner.idEscaner === idScanner) {
            this.currentScanner.set({ ...currentScanner, objEstado: { ...currentScanner.objEstado, enumEstadoEscaner: newState } });
            this.updateNavItemsForExpand(this.currentScanner()!); // Added non-null assertion
          }
        },
        error: (err) => console.error('Error al detener escáner:', err)
      });
    }
  }
}
