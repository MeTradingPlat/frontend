import { Component, OnInit, inject, effect, signal, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormTime } from '../../../../components/forms/form-time/form-time';
import { FormSelect } from '../../../../components/forms/form-select/form-select';
import { EnumTipoEjecucion } from '../../../../enums/enum-tipo-ejecucion';
import { EscanerDTOPeticion } from '../../../../models/escaner.model';
import { EnumConfigurationCard } from '../../../../enums/enum-configuration-card';

@Component({
  selector: 'app-card-time',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormTime, FormSelect],
  templateUrl: './card-time.html',
  styleUrls: ['./card-time.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardTime implements OnInit {
  private fb = inject(FormBuilder);

  timeForm!: FormGroup;

  @Input() displayTitle: string = '';
  @Input() submitted: boolean = false;
  @Input() scannerData: EscanerDTOPeticion | undefined;

  @Output() cardDataChange = new EventEmitter<{ cardType: EnumConfigurationCard, data: any }>(); // Corrected name
  @Output() formValidityChange = new EventEmitter<{ cardType: EnumConfigurationCard, isValid: boolean }>();

  public EnumTipoEjecucion = EnumTipoEjecucion;
  public EnumConfigurationCard = EnumConfigurationCard; // Added for template access

  constructor() {
    // Efecto que sincroniza el formulario si cambian los datos externos
    effect(() => {
      const data = this.scannerData; // Access input property directly
      if (data && this.timeForm) {
        this.timeForm.patchValue({
          horaInicio: data.horaInicio?.substring(0, 5),
          horaFin: data.horaFin?.substring(0, 5),
          tipoEjecucion: data.objTipoEjecucion?.enumTipoEjecucion ?? ''
        }, { emitEvent: false }); // evita loop infinito
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm(this.scannerData);
  }

  private initializeForm(data: EscanerDTOPeticion | undefined): void {
    this.timeForm = this.fb.group({
      horaInicio: [data?.horaInicio?.substring(0, 5) || '', Validators.required],
      horaFin: [data?.horaFin?.substring(0, 5) || '', Validators.required],
      // 🔑 Se maneja como string
      tipoEjecucion: [data?.objTipoEjecucion?.enumTipoEjecucion?.toString() || '', Validators.required],
    });

    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    this.timeForm.valueChanges.subscribe(value => {
      const payload = {
        horaInicio: value.horaInicio,
        horaFin: value.horaFin,
        objTipoEjecucion: {
          enumTipoEjecucion: value.tipoEjecucion || ''
        }
      };

      console.log('📤 Emitting form changes:', payload, '✅ Valid:', this.timeForm.valid);
      this.cardDataChange.emit({ cardType: EnumConfigurationCard.TIME, data: payload }); // Corrected emit
      this.formValidityChange.emit({ cardType: EnumConfigurationCard.TIME, isValid: this.timeForm.valid });
    });
  }

  get timeFormHoraInicioControl(): FormControl {
    return this.timeForm.get('horaInicio') as FormControl;
  }

  get timeFormHoraFinControl(): FormControl {
    return this.timeForm.get('horaFin') as FormControl;
  }

  get timeFormTipoEjecucionControl(): FormControl {
    return this.timeForm.get('tipoEjecucion') as FormControl;
  }

  getTimeErrorMessage(controlName: string, errorName: string): boolean {
    return this.submitted && this.timeForm.get(controlName)?.hasError(errorName) || false;
  }
}
