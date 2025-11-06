import { ChangeDetectionStrategy, Component, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';

interface RegistryRow {
  fecha: string;
  evento: string;
  descripcion: string;
}

@Component({
  selector: 'app-scanner-registry-tab',
  imports: [
    CommonModule,
    MatTableModule,
    TranslatePipe
  ],
  templateUrl: './scanner-registry-tab.html',
  styleUrl: './scanner-registry-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerRegistryTab implements OnInit {
  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['fecha', 'evento', 'descripcion'];
  dataSource = signal<RegistryRow[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadRegistry();
  }

  loadRegistry(): void {
    this.loading.set(true);

    // TODO: Implementar llamada al backend cuando esté disponible
    // Por ahora simulamos que no hay registros
    setTimeout(() => {
      this.dataSource.set([]);
      this.loading.set(false);
    }, 500);
  }
}
