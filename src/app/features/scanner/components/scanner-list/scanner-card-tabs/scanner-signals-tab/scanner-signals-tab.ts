import { ChangeDetectionStrategy, Component, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';

interface SignalRow {
  fecha: string;
  nombre: string;
  accion: string;
  tp: string;
  sl: string;
}

@Component({
  selector: 'app-scanner-signals-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './scanner-signals-tab.html',
  styleUrl: './scanner-signals-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerSignalsTab implements OnInit {
  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['fecha', 'nombre', 'accion', 'tp', 'sl', 'details'];
  dataSource = signal<SignalRow[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadSignals();
  }

  loadSignals(): void {
    this.loading.set(true);

    // TODO: Implementar llamada al backend cuando esté disponible
    // Por ahora simulamos que no hay señales
    setTimeout(() => {
      this.dataSource.set([]);
      this.loading.set(false);
    }, 500);
  }

  onViewDetails(signal: SignalRow): void {
    console.log('Ver detalles de señal:', signal);
    // TODO: Implementar modal o navegación para ver detalles
  }
}
