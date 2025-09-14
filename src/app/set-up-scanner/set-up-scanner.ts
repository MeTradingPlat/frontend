import { Component, OnInit, OnDestroy, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { SecondNavbar } from '../second-navbar/second-navbar';
import { ConfigurationCard, EnumConfigurationCard } from '../configuration-card/configuration-card'; // Import ConfigurationCard and EnumConfigurationCard

interface NavItem {
  readonly path: string;
  readonly iconClass: string;
  readonly buttonText: string;
}

/* EnumConfigurationCard is imported from configuration-card.ts to maintain a single source of truth. */

@Component({
  selector: 'app-set-up-scanner',
  standalone: true,
  imports: [CommonModule, SecondNavbar, ConfigurationCard], // Add ConfigurationCard to imports
  templateUrl: './set-up-scanner.html',
  styleUrl: './set-up-scanner.css'
})
export class SetUpScanner implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  
  scannerId: string | null = null;
  title = '';
  navItems: NavItem[] = [];
  backPath: string = '/escaner';
  // EnumConfigurationCard is directly accessible as it's imported

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  get configurationCardTypes(): EnumConfigurationCard[] {
    return Object.keys(EnumConfigurationCard) // Use EnumConfigurationCard directly
      .filter(key => !isNaN(Number(key)))
      .map(key => Number(key) as EnumConfigurationCard);
  }

  ngOnInit(): void {
    // Observa cambios de navegación
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.initializeView();
    });
    
    // Inicialización inicial
    this.initializeView();
  }

  private initializeView(): void {
    this.scannerId = this.route.snapshot.paramMap.get('id');
    
    if (this.scannerId) {
      this.setupEditMode();
    } else {
      this.setupCreateMode();
    }
  }

  private setupEditMode(): void {
    this.title = $localize`Escáner: ${this.scannerId}`;
    this.navItems = [
      { 
        path: '', 
        iconClass: 'bi bi-archive', 
        buttonText: $localize`Archivar` 
      },
      { 
        path: '', 
        iconClass: 'bi bi-trash3-fill', // Corregido: bi-trash-fill no existe
        buttonText: $localize`Borrar` 
      }
    ];
  }

  private setupCreateMode(): void {
    this.title = $localize`Nuevo Escáner`;
    this.navItems = [
      { 
        path: '', 
        iconClass: 'bi bi-save-fill', // Más semántico que download para guardar
        buttonText: $localize`Guardar` 
      },
      { 
        path: '', 
        iconClass: 'bi bi-archive', 
        buttonText: $localize`Archivar` 
      }
    ];
  }

  onNavbarButtonClick(buttonText: string): void {
    const buttonActions: Record<string, () => void> = {
      'Atrás': () => this.navigateBack(),
      'Guardar': () => this.handleSave(),
      'Archivar': () => this.handleArchive(),
      'Borrar': () => this.handleDelete()
    };

    const action = buttonActions[buttonText];
    if (action) {
      action();
    } else {
      console.warn(`Acción no implementada para: ${buttonText}`);
    }
  }

  private navigateBack(): void {
    this.router.navigate(['/escaner']);
  }

  private handleSave(): void {
    console.log('Guardar escáner');
    // TODO: Implementar lógica de guardado
  }

  private handleArchive(): void {
    console.log('Archivar escáner');
    // TODO: Implementar lógica de archivado
  }

  private handleDelete(): void {
    console.log('Borrar escáner');
    // TODO: Implementar lógica de eliminación
  }
}