import { ChangeDetectionStrategy, Component, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../../models/escaner.interface';

interface AssetRow {
  fecha: string;
  nombre: string;
  stock: string;
}

@Component({
  selector: 'app-scanner-assets-tab',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './scanner-assets-tab.html',
  styleUrl: './scanner-assets-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScannerAssetsTab implements OnInit {
  scanner = input.required<Escaner>();

  displayedColumns: string[] = ['fecha', 'nombre', 'stock', 'details'];
  dataSource = signal<AssetRow[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.loading.set(true);

    // TODO: Implementar llamada al backend cuando esté disponible
    // Por ahora simulamos que no hay activos
    setTimeout(() => {
      this.dataSource.set([]);
      this.loading.set(false);
    }, 500);
  }

  onViewDetails(asset: AssetRow): void {
    console.log('Ver detalles de activo:', asset);
    // TODO: Implementar modal o navegación para ver detalles
  }
}
