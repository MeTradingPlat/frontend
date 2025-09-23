import { Component, input, output, ChangeDetectionStrategy, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

import { EnumConfigurationCard } from '../../../../enums/enum-configuration-card';
import { EscanerDTOPeticion } from '../../../../models/escaner.model';

import { FormText } from '../../../forms/form-text/form-text';
import { FormTextArea } from '../../../forms/form-text-area/form-text-area';

@Component({
  selector: 'app-card-general',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormText,
    FormTextArea
  ],
  templateUrl: './card-general.html',
  styleUrl: './card-general.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardGeneral implements OnInit {
  submitted = input<boolean>(false);
  scannerData = input<EscanerDTOPeticion | undefined>(undefined);
  cardDataChange = output<{ cardType: EnumConfigurationCard, data: any }>();
  formValidityChange = output<{ cardType: EnumConfigurationCard, isValid: boolean }>();

  generalForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    effect(() => {
      this.initializeForm(this.scannerData());
    });
  }

  ngOnInit(): void {
    this.initializeForm(this.scannerData());
  }

  private initializeForm(data: EscanerDTOPeticion | undefined): void {
    const transformedData = this.transformedScannerData();

    this.generalForm = this.fb.group({
      nombreEscaner: [transformedData.nombreEscaner || '', [Validators.required, Validators.minLength(3)]],
      descripcion: [transformedData.descripcion || '', [Validators.required, Validators.minLength(5)]]
    });

    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    this.generalForm.valueChanges.subscribe(() => this.emitFormChanges());
    this.generalForm.statusChanges.subscribe(() => this.emitFormChanges());
  }

  private emitFormChanges(): void {
    const formData = {
      nombre: this.generalFormNombreEscanerControl.value,
      descripcion: this.generalFormDescripcionControl.value
    };

    this.cardDataChange.emit({ cardType: EnumConfigurationCard.GENERAL, data: formData });
    this.formValidityChange.emit({ cardType: EnumConfigurationCard.GENERAL, isValid: this.generalForm.valid });
  }

  displayTitle = computed(() => {
    return $localize`General`;
  });

  transformedScannerData = computed(() => {
    const data = this.scannerData();
    if (!data) {
      return {};
    }
    return {
      nombreEscaner: data.nombre,
      descripcion: data.descripcion,
    };
  });

  get generalFormNombreEscanerControl(): FormControl {
    return this.generalForm.get('nombreEscaner') as FormControl;
  }

  get generalFormDescripcionControl(): FormControl {
    return this.generalForm.get('descripcion') as FormControl;
  }

  getGeneralErrorMessage(controlName: string, errorName: string): string {
    const control = this.generalForm.get(controlName);
    if (control?.hasError(errorName) && (control.dirty || control.touched || this.submitted())) {
      switch (controlName) {
        case 'nombreEscaner':
          if (errorName === 'required') return $localize`El nombre del escáner es requerido.`;
          if (errorName === 'minlength') return $localize`El nombre debe tener al menos 3 caracteres.`;
          break;
        case 'descripcion':
          if (errorName === 'required') return $localize`La descripción del escáner es requerida.`;
          if (errorName === 'minlength') return $localize`La descripción debe tener al menos 5 caracteres.`;
          break;
      }
    }
    return '';
  }
}
