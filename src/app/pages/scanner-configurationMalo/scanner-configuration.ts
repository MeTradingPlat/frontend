import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavMenuItem } from '../../models/navbar.model';
import { ScannerConfigurationService } from './scanner-configuration.service';
import { EnumConfigurationCard } from '../../enums/enum-configuration-card';
import { EnumEstadoEscaner } from '../../enums/enum-estado-escaner';

import { NavbarAux } from '../../components/navbar/navbar-aux/navbar-aux';
import { LoadPage } from '../../components/page-state/load-page/load-page';
import { LoadPageError } from '../../components/page-state/load-page-error/load-page-error';
import { CardGeneral } from '../../components/scanner/configuration-card/card-general/card-general';
import { CardTime } from '../../components/scanner/configuration-card/card-time/card-time';
import { CardMarket } from '../../components/scanner/configuration-card/card-market/card-market';
import { CardFilter } from '../../components/scanner/configuration-card/card-filter/card-filter';

@Component({
  selector: 'app-scanner-configuration',
  standalone: true,
  imports: [
    CommonModule,
    NavbarAux,
    LoadPage,
    LoadPageError,
    CardGeneral,
    CardTime,
    CardMarket,
    CardFilter
  ],
  templateUrl: './scanner-configuration.html',
  styleUrl: './scanner-configuration.css'
})
export class ScannerConfiguration {
  protected readonly scannerConfigService = inject(ScannerConfigurationService);

  backPath = '/escaner';
  EnumConfigurationCard = EnumConfigurationCard;

  title = computed(() => {
    const isNew = this.scannerConfigService.isNewScanner();
    const scannerName = this.scannerConfigService.currentScannerData()?.nombre;
    return isNew ? $localize`Nuevo Escáner` : (scannerName ? scannerName : $localize`Editar Escáner`);
  });

  navItems = computed<NavMenuItem[]>(() => {
    const items: NavMenuItem[] = [];
    const isNewScanner = this.scannerConfigService.isNewScanner();
    const isFormValid = this.scannerConfigService.isFormValid();
    const currentScannerState = this.scannerConfigService.scannerEstado();
    const isLoading = this.scannerConfigService.loading();

    items.push({
      id: 1,
      path: '',
      iconClass: 'bi bi-save2-fill',
      buttonText: $localize`Guardar`,
      action: () => this.scannerConfigService.saveScannerConfiguration(this.backPath),
      disabled: !isFormValid || isLoading,
    });

    if (!isNewScanner) {
      if (currentScannerState === EnumEstadoEscaner.ARCHIVADO) {
        items.push({
          id: 2,
          path: '',
          iconClass: 'bi bi-box-arrow-in-up',
          buttonText: $localize`Desarchivar`,
          action: () => this.scannerConfigService.unarchiveScanner(this.backPath),
          disabled: isLoading,
        });
      } else if (currentScannerState === EnumEstadoEscaner.DETENIDO || currentScannerState === EnumEstadoEscaner.DESARCHIVADO) {
        items.push({
          id: 3,
          path: '',
          iconClass: 'bi bi-archive-fill',
          buttonText: $localize`Archivar`,
          action: () => this.scannerConfigService.archiveScanner(this.backPath),
          disabled: isLoading,
        });
      }

      items.push({
        id: 4,
        path: '',
        iconClass: 'bi bi-trash-fill',
        buttonText: $localize`Eliminar`,
        action: () => this.scannerConfigService.deleteScanner(this.backPath),
        disabled: isLoading,
      });
    }
    return items;
  });

  onNavButtonClicked(item: NavMenuItem): void {
    if (item.action) {
      item.action();
    }
  }

  onCardDataChange(event: { cardType: EnumConfigurationCard, data: any }): void {
    this.scannerConfigService.updateCardData(event.cardType, event.data);
  }

  onFormValidityChange(event: { cardType: EnumConfigurationCard, isValid: boolean }): void {
    this.scannerConfigService.updateFormValidity(event.cardType, event.isValid);
  }
}
