import { Component, Input, OnInit } from '@angular/core';
import { Forms, FormField, CONTROL_TYPE } from '../forms/forms';

export enum EnumConfigurationCard {
  GENERAL,
  TIME,
  MARKET,
  FILTERS,
}

export enum EnumTipoEjecucion {
  UNA_VEZ,
  DIARIA,
}

export enum EnumMercado {
  NYSE = 'NYSE',
  NASDAQ = 'NASDAQ',
  AMEX = 'AMEX',
  ETF = 'ETF',
  OTC = 'OTC',
}

@Component({
  selector: 'app-configuration-card',
  standalone: true,
  imports: [Forms],
  templateUrl: './configuration-card.html',
  styleUrls: ['./configuration-card.css'],
})
export class ConfigurationCard implements OnInit {
  @Input() cardType!: EnumConfigurationCard;
  displayTitle = '';

  EnumConfigurationCard = EnumConfigurationCard;
  EnumTipoEjecucion = EnumTipoEjecucion;
  // EnumMercado is directly accessible as it's exported at module level

  // Definición de campos para el formulario GENERAL
  generalFormFields: FormField[] = [
    {
      key: 'nombreEscaner',
      type: CONTROL_TYPE.TEXT,
      label: $localize`Nombre Escáner`,
      placeholder: $localize`Ingrese el nombre`,
    },
    {
      key: 'descripcion',
      type: CONTROL_TYPE.TEXTAREA,
      label: $localize`Descripción`,
      placeholder: $localize`Descripción (opcional)`,
    },
  ];

  // Definición de campos para el formulario de MARKET
  marketFormFields: FormField[] = [
    {
      key: 'mercadosSeleccionados',
      type: CONTROL_TYPE.CHECKBOX_GROUP,
      label: '', // Remove the label as the card header provides the title
      options: [
        { key: EnumMercado.NYSE, value: EnumMercado.NYSE, checked: true },
        { key: EnumMercado.NASDAQ, value: EnumMercado.NASDAQ, checked: true },
        { key: EnumMercado.AMEX, value: EnumMercado.AMEX, checked: true },
        { key: EnumMercado.ETF, value: EnumMercado.ETF, checked: false },
        { key: EnumMercado.OTC, value: EnumMercado.OTC, checked: false },
      ],
    },
  ];

  timeFormFields: FormField[] = [
    {
      key: 'horaInicio',
      type: CONTROL_TYPE.TIME,
      label: $localize`Hora de Inicio`,
      value: '09:30',
      icon: 'bi bi-clock-fill',
    },
    {
      key: 'horaFin',
      type: CONTROL_TYPE.TIME,
      label: $localize`Hora de Fin`,
      value: '15:55',
      icon: 'bi bi-clock-fill',
    },
    {
      key: 'tipoEjecucion',
      type: CONTROL_TYPE.SELECT,
      label: $localize`Tipo de Ejecución`,
      options: [
        { key: EnumTipoEjecucion.UNA_VEZ.toString(), value: $localize`Una vez` },
        { key: EnumTipoEjecucion.DIARIA.toString(), value: $localize`Repetir` },
      ],
      value: EnumTipoEjecucion.UNA_VEZ.toString(),
    },
  ];

  ngOnInit(): void {
    this.setLocalizedTitle();
  }

  private setLocalizedTitle(): void {
    switch (this.cardType) {
      case EnumConfigurationCard.GENERAL:
        this.displayTitle = $localize`General`;
        break;
      case EnumConfigurationCard.TIME:
        this.displayTitle = $localize`Tiempo`;
        break;
      case EnumConfigurationCard.MARKET:
        this.displayTitle = $localize`Mercado`;
        break;
      case EnumConfigurationCard.FILTERS:
        this.displayTitle = $localize`Filtros`;
        break;
      default:
        this.displayTitle = '';
    }
  }
}
