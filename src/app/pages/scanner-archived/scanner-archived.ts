import { Component, inject, signal } from '@angular/core';
import { NavMenuItem } from '../../models/navbar.model';
import { EscanerDTORespuesta } from '../../models/escaner.model';
import { EscanerService } from '../../services/escaner.service';
import { NavbarAux } from "../../components/navbar/navbar-aux/navbar-aux";
import { ScannerArchivedTable } from '../../components/scanner/scanner-archived-table/scanner-archived-table';

@Component({
  selector: 'app-scanner-archived',
  imports: [NavbarAux, ScannerArchivedTable],
  templateUrl: './scanner-archived.html',
  styleUrl: './scanner-archived.css'
})
export class ScannerArchived {
  readonly title: string = $localize`Escáneres archivados`;
  readonly navItems: NavMenuItem[] = [];
  backPath = signal<string>('/escaner');
  archivedScanners = signal<EscanerDTORespuesta[]>([]);
  private escanerService = inject(EscanerService);

  ngOnInit(): void {
    this.escanerService.getArchivedEscaneres().subscribe(scanners => {
      this.archivedScanners.set(scanners);
    });
  }
}
