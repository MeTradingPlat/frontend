import { Component, input, output, signal, computed, ChangeDetectionStrategy, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ParametroDTORespuesta } from '../../../models/parametro.model';
import { ValorCondicionalDTORespuesta } from '../../../models/valor.model';
import { EnumCondicional } from '../../../enums/enum-condicional';
import { EnumTipoValor } from '../../../enums/enum-tipo-valor';
import { FormSelect } from '../../forms/form-select/form-select';
import { FormText } from '../../forms/form-text/form-text';

interface SelectOption {
  key: string;
  value: string;
  enum?: string;
}

@Component({
  selector: 'app-filter-parameter-conditional',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FormSelect, FormText],
  templateUrl: './filter-parameter-conditional.html',
  styleUrl: './filter-parameter-conditional.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterParameterConditional implements OnInit {
  parametro = input.required<ParametroDTORespuesta>();
  parameterChange = output<ParametroDTORespuesta>();
  submitted = input<boolean>(false); // Added submitted input

  conditionalForm = new FormGroup({
    conditional: new FormControl<EnumCondicional | null>(null),
    valor1: new FormControl<number | null>(null),
    valor2: new FormControl<number | null>(null),
  });

  conditionalOptions = computed<SelectOption[]>(() => {
    return this.parametro().opciones.map(option => ({
      key: (option as ValorCondicionalDTORespuesta).enumCondicional,
      value: option.etiqueta,
      enum: (option as ValorCondicionalDTORespuesta).enumCondicional
    }));
  });

  constructor() {
    effect(() => {
      const parametro = this.parametro();
      const selectedValue = this.parametro().objValorSeleccionado as ValorCondicionalDTORespuesta;
      if (selectedValue) {
        this.conditionalForm.patchValue({
          conditional: selectedValue.enumCondicional,
          valor1: selectedValue.valor1,
          valor2: selectedValue.valor2,
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.conditionalForm.valueChanges.subscribe(values => {
      const updatedParametro = { ...this.parametro() };
      const selectedValue = updatedParametro.objValorSeleccionado as ValorCondicionalDTORespuesta;
      selectedValue.enumCondicional = values.conditional!;
      selectedValue.valor1 = values.valor1!;
      selectedValue.valor2 = values.valor2!;
      this.parameterChange.emit(updatedParametro);
    });

    this.conditionalForm.get('conditional')?.valueChanges.subscribe(value => {
      if (value !== EnumCondicional.ENTRE && value !== EnumCondicional.FUERA) {
        this.conditionalForm.get('valor2')?.reset(undefined, { emitEvent: false });
      }
    });
  }

  get inputType(): string {
    const selectedValue = this.parametro().opciones.find(
      option => (option as ValorCondicionalDTORespuesta).enumCondicional === this.conditionalForm.get('conditional')?.value
    );
    return selectedValue?.enumTipoValor === EnumTipoValor.INTEGER ? 'number' : 'text';
  }

  showSecondInput(): boolean {
    const conditional = this.conditionalForm.get('conditional')?.value;
    return conditional === EnumCondicional.ENTRE || conditional === EnumCondicional.FUERA;
  }

  trackByOption(index: number, option: SelectOption): any {
    return option.enum ?? index;
  }
}
