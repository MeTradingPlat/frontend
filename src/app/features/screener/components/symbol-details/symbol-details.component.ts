import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScreenerService } from '../../services/screener.service';
import { SymbolDetails } from '../../models/screener.models';

@Component({
  selector: 'app-symbol-details',
  templateUrl: './symbol-details.component.html',
  styleUrls: ['./symbol-details.component.scss']
})
export class SymbolDetailsComponent implements OnInit {
  private screenerService = inject(ScreenerService);
  private dialogRef = inject(MatDialogRef<SymbolDetailsComponent>);
  data = inject(MAT_DIALOG_DATA);

  symbolDetails = signal<SymbolDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDetails();
  }

  loadDetails(): void {
    this.isLoading.set(true);
    this.screenerService.getSymbolDetails(this.data.symbol).subscribe({
      next: (details) => {
        this.symbolDetails.set(details);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading symbol details:', err);
        this.error.set('No se pudo cargar la información fundamental del símbolo.');
        this.isLoading.set(false);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    return value.toLocaleString();
  }
}
