import { Component, input, output, ChangeDetectionStrategy, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators, AbstractControl, ReactiveFormsModule, ValidatorFn, ValidationErrors } from '@angular/forms';

import { EnumConfigurationCard } from '../../../../enums/enum-configuration-card';
import { EnumMercado } from '../../../../enums/enum-mercado';
import { EscanerDTOPeticion } from '../../../../models/escaner.model';

import { FormCheckbox } from '../../../forms/form-checkbox/form-checkbox';

// Custom validator to ensure at least one checkbox is selected
const minOneCheckboxSelectedValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const formArray = control as FormArray;
  const checkedCount = formArray.controls.filter(c => c.value).length;
  return checkedCount > 0 ? null : { minSelected: true };
};

@Component({
  selector: 'app-card-market',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormCheckbox
  ],
  templateUrl: './card-market.html',
  styleUrl: './card-market.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardMarket implements OnInit {
  submitted = input<boolean>(false);
  scannerData = input<EscanerDTOPeticion | undefined>(undefined);
  cardDataChange = output<{ cardType: EnumConfigurationCard, data: any }>();
  formValidityChange = output<{ cardType: EnumConfigurationCard, isValid: boolean }>();

  EnumMercado = EnumMercado;

  marketForm!: FormGroup;
  private _isEmittingChanges = false;
  private _formInitialized = false;
  private _lastScannerDataHash: string = '';

  constructor(private fb: FormBuilder) {
    effect(() => {
      const currentData = this.scannerData();
      const currentHash = JSON.stringify(currentData?.mercados);
      
      // Solo procesar si:
      // 1. El form está inicializado
      // 2. No estamos emitiendo cambios
      // 3. Los datos realmente cambiaron
      if (this._formInitialized && 
          !this._isEmittingChanges && 
          currentHash !== this._lastScannerDataHash) {
        
        this._lastScannerDataHash = currentHash;
        this.patchFormValues(currentData);
      }
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this._formInitialized = true;
    
    // Patch initial values and store the hash
    const initialData = this.scannerData();
    this._lastScannerDataHash = JSON.stringify(initialData?.mercados);
    this.patchFormValues(initialData);
    
    this.setupFormListeners();
  }

  private buildForm(): void {
    const allMarkets = Object.values(EnumMercado).filter(value => typeof value === 'string') as string[];
    const marketControls = allMarkets.map(() => new FormControl(false));

    this.marketForm = this.fb.group({
      mercadosSeleccionados: this.fb.array(marketControls, minOneCheckboxSelectedValidator)
    });
  }

  private patchFormValues(data: EscanerDTOPeticion | undefined): void {
    if (!this._formInitialized || this._isEmittingChanges) {
      return;
    }
    
    const transformedData = this.transformedScannerData();
    const selectedMarkets = transformedData.mercadosSeleccionados || [];
    const marketFormArray = this.marketForm.get('mercadosSeleccionados') as FormArray;
    const allMarkets = Object.values(EnumMercado).filter(value => typeof value === 'string') as string[];

    let hasChanges = false;

    // Verificar si realmente hay cambios antes de aplicar el patch
    allMarkets.forEach((market, index) => {
      const isSelected = selectedMarkets.includes(market as EnumMercado);
      const control = marketFormArray.at(index);
      if (control && control.value !== isSelected) {
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      return;
    }

    // Aplicar cambios sin emitir eventos
    this._isEmittingChanges = true;
    
    allMarkets.forEach((market, index) => {
      const isSelected = selectedMarkets.includes(market as EnumMercado);
      const control = marketFormArray.at(index);
      if (control && control.value !== isSelected) {
        control.setValue(isSelected, { emitEvent: false });
      }
    });

    // Actualizar validación y emitir evento solo una vez al final
    marketFormArray.updateValueAndValidity({ emitEvent: true });
    
    this._isEmittingChanges = false;
  }

  private setupFormListeners(): void {
    this.marketForm.valueChanges.subscribe(value => {
      if (!this._isEmittingChanges) {
        this.emitFormChanges();
      }
    });
    
    this.marketForm.statusChanges.subscribe(status => {
      if (!this._isEmittingChanges) {
        this.emitFormChanges();
      }
    });
  }

  private emitFormChanges(): void {
    if (this._isEmittingChanges) {
      return;
    }

    this._isEmittingChanges = true;

    const selectedMarketKeys = this.marketFormMercadosSeleccionadosControl.controls
      .map((control, i) => control.value ? Object.values(EnumMercado).filter(value => typeof value === 'string')[i] : null)
      .filter(value => value !== null);

    const formData = {
      mercados: selectedMarketKeys.map(key => ({ enumMercado: key }))
    };

    // 🔍 LOGS CLAVE
    console.log('[CardMarket] Emitiendo datos del formulario:', formData);
    console.log('[CardMarket] Formulario válido:', this.marketForm.valid);

    this.cardDataChange.emit({ cardType: EnumConfigurationCard.MARKET, data: formData });
    this.formValidityChange.emit({ cardType: EnumConfigurationCard.MARKET, isValid: this.marketForm.valid });

    setTimeout(() => {
      this._isEmittingChanges = false;
    }, 0);
  }

  displayTitle = computed(() => {
    return $localize`Mercado`;
  });

  transformedScannerData = computed(() => {
    const data = this.scannerData();
    if (!data) {
      return {};
    }
    return {
      mercadosSeleccionados: data.mercados?.map(m => m.enumMercado) || []
    };
  });

  readonly marketOptions = Object.values(EnumMercado).filter(value => typeof value === 'string').map(market => ({
    key: market,
    value: market
  }));

  get marketFormMercadosSeleccionadosControl(): FormArray {
    return this.marketForm.get('mercadosSeleccionados') as FormArray;
  }

  getMarketErrorMessage(controlName: string, errorName: string): string {
    const control = this.marketForm.get(controlName);
    if (control?.hasError(errorName) && (control.dirty || control.touched || this.submitted())) {
      if (errorName === 'minSelected') return $localize`Se debe seleccionar al menos 1 mercado.`;
    }
    return '';
  }

  onMarketSelectionChange(event: any): void {
    // Este método se puede usar para efectos secundarios si es necesario
  }
}