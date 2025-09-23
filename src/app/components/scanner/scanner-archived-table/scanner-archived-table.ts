import { Component, input } from '@angular/core';
import { EscanerDTORespuesta } from '../../../models/escaner.model';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-scanner-archived-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scanner-archived-table.html',
  styleUrl: './scanner-archived-table.css'
})
export class ScannerArchivedTable {
  scanners = input<EscanerDTORespuesta[]>();

  constructor(private router: Router) { } // Inject Router

  trackByScannerId(index: number, scanner: EscanerDTORespuesta): number {
    return scanner.idEscaner;
  }

  navigateToConfiguration(scannerId: string): void {
    this.router.navigate(['/escaner/configuracion', scannerId]);
  }

  navigateToExpand(scannerId: string): void {
    this.router.navigate(['/escaner/expandir', scannerId]);
  }
}
