import { Component, input, output, computed, ChangeDetectionStrategy, effect, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { ParametroDTORespuesta } from '../../../models/parametro.model';
import { ValorCondicionalDTORespuesta } from '../../../models/valor.model';
import { EnumCondicional } from '../../../enums/enum-condicional';
import { FormSelect } from '../../forms/form-select/form-select';
import { FormText } from '../../forms/form-text/form-text';

interface SelectOption {
  key: string;
  value: string;
}

@Component({
  selector: 'app-filter-parameter-conditional',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormSelect, FormText],
  templateUrl: './filter-parameter-conditional.html',
  styleUrl: './filter-parameter-conditional.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class FilterParameterConditional implements OnInit {
  protected EnumCondicional = EnumCondicional;
  
  
  
  
  private fb = inject(FormBuilder);

  protected Validators = Validators;
  conditionalForm!: FormGroup;

  submitted = input(false);
  parametro = input.required<ParametroDTORespuesta>();
  cardDataChange = output<{ cardType: ParametroDTORespuesta, data: any }>();
  parameterChange = output<ParametroDTORespuesta>();

  get conditionalSelectControl(): FormControl {
    if (!this.conditionalForm) {
      return new FormControl(null);
    }
    return this.conditionalForm.get('conditional-select') as FormControl;
  }

  get value1Control(): FormControl {
    if (!this.conditionalForm) {
      return new FormControl(null);
    }
    return this.conditionalForm.get('value1') as FormControl;
  }

  get value2Control(): FormControl {
    if (!this.conditionalForm) {
      return new FormControl(null);
    }
    return this.conditionalForm.get('value2') as FormControl;
  }

  selectOptions = computed<SelectOption[]>(() => {
    return Object.values(EnumCondicional).map(key => ({
      key: key,
      value: this.formatEnumKey(key)
    }));
  });

  constructor() {
    effect(() => {
      const parametro = this.parametro();
      if (this.conditionalForm) {
        const selectedConditional = (parametro.objValorSeleccionado as ValorCondicionalDTORespuesta)?.enumCondicional;
        const valor1 = (parametro.objValorSeleccionado as ValorCondicionalDTORespuesta)?.valor1;
        const valor2 = (parametro.objValorSeleccionado as ValorCondicionalDTORespuesta)?.valor2;

        this.conditionalSelectControl.setValue(selectedConditional || null, { emitEvent: false });
        this.value1Control.setValue(valor1 ?? null, { emitEvent: false });
        this.value2Control.setValue(valor2 ?? null, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm(this.parametro());
    this.setupFormListeners();
  }

  private initializeForm(parametro: ParametroDTORespuesta): void {
    const selectedConditional = (parametro.objValorSeleccionado as ValorCondicionalDTORespuesta)?.enumCondicional;
    const valor1 = (parametro.objValorSeleccionado as ValorCondicionalDTORespuesta)?.valor1;
    const valor2 = (parametro.objValorSeleccionado as ValorCondicionalDTORespuesta)?.valor2;

    this.conditionalForm = this.fb.group({
      'conditional-select': [selectedConditional || null, Validators.required],
      'value1': [valor1 ?? null, Validators.required],
      'value2': [valor2 ?? null], // valor2 is optional
    });

    this.updateValue2Validators(selectedConditional);
  }

  private setupFormListeners(): void {
    this.conditionalSelectControl.valueChanges.subscribe(value => {
      this.updateValue2Validators(value);
      this.emitChanges();
    });

    this.value1Control.valueChanges.subscribe(() => this.emitChanges());
    this.value2Control.valueChanges.subscribe(() => this.emitChanges());
  }

  private updateValue2Validators(conditional: EnumCondicional): void {
    if (conditional === EnumCondicional.ENTRE || conditional === EnumCondicional.FUERA) {
      this.value2Control.addValidators(Validators.required);
    } else {
      this.value2Control.removeValidators(Validators.required);
      this.value2Control.setValue(null); // Clear value2 if not needed
    }
    this.value2Control.updateValueAndValidity();
  }

  private emitChanges(): void {
    const updatedParametro = { ...this.parametro() };
    const selectedConditional = this.conditionalSelectControl.value;
    const valor1 = this.value1Control.value;
    const valor2 = this.value2Control.value;

    (updatedParametro.objValorSeleccionado as ValorCondicionalDTORespuesta) = {
      ...(updatedParametro.objValorSeleccionado as ValorCondicionalDTORespuesta),
      enumCondicional: selectedConditional,
      valor1: valor1,
      valor2: (selectedConditional === EnumCondicional.ENTRE || selectedConditional === EnumCondicional.FUERA) ? valor2 : undefined,
    };
    this.parameterChange.emit(updatedParametro);
  }

  trackByOption(index: number, option: SelectOption): any {
    return option.key ?? index;
  }
  private formatEnumKey(key: string): string {
    return key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }
}
