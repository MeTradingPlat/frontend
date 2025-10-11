import { Component, input, output, ChangeDetectionStrategy, effect, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ParametroDTORespuesta } from '../../../models/parametro.model';
import { ValorFloatDTORespuesta, ValorIntegerDTORespuesta, ValorStringDTORespuesta, ValorCondicionalDTORespuesta } from '../../../models/valor.model';
import { EnumTipoValor } from '../../../enums/enum-tipo-valor';
import { FormText } from '../../forms/form-text/form-text';
import { FormSelect } from '../../forms/form-select/form-select';
import { EnumCondicional } from '../../../enums/enum-condicional';

interface SelectOption {
  key: string;
  value: string;
  enum?: string;
}

@Component({
  selector: 'app-filter-parameter-number',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FormText, FormSelect],
  templateUrl: './filter-parameter-number.html',
  styleUrl: './filter-parameter-number.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterParameterNumber implements OnInit {
  parametro = input.required<ParametroDTORespuesta>();
  parameterChange = output<ParametroDTORespuesta>();
  submitted = input<boolean>(false); // Added submitted input

  valueControl = new FormControl<number | string | null>(null);

  hasOptions = computed(() => this.parametro().opciones && this.parametro().opciones.length > 0);

  selectOptions = computed<SelectOption[]>(() => {
    if (this.hasOptions()) {
      return this.parametro().opciones.map(option => ({
        key: (option as ValorStringDTORespuesta).valor || option.etiqueta,
        value: option.etiqueta,
        enum: (option as ValorStringDTORespuesta).valor || option.etiqueta
      }));
    }
    return [];
  });

  constructor() {
    effect(() => {
      const parametro = this.parametro();
      const selectedValue = parametro.objValorSeleccionado;

      if (this.hasOptions()) {
        const valor = (selectedValue as ValorStringDTORespuesta).valor;
        this.valueControl.setValue(valor || null, { emitEvent: false });
      } else {
        if (selectedValue.enumTipoValor === EnumTipoValor.INTEGER) {
          const valor = (selectedValue as ValorIntegerDTORespuesta).valor;
          this.valueControl.setValue(valor, { emitEvent: false });
        } else if (selectedValue.enumTipoValor === EnumTipoValor.FLOAT) {
          const valor = (selectedValue as ValorFloatDTORespuesta).valor;
          this.valueControl.setValue(valor, { emitEvent: false });
        }
      }
    });
  }

  ngOnInit(): void {
    this.valueControl.valueChanges.subscribe(value => {
      const updatedParametro = { ...this.parametro() };
      if (this.hasOptions()) {
        (updatedParametro.objValorSeleccionado as ValorStringDTORespuesta).valor = value as string;
      } else {
        if (updatedParametro.objValorSeleccionado.enumTipoValor === EnumTipoValor.INTEGER) {
          (updatedParametro.objValorSeleccionado as ValorIntegerDTORespuesta).valor = value as number;
        } else if (updatedParametro.objValorSeleccionado.enumTipoValor === EnumTipoValor.FLOAT) {
          (updatedParametro.objValorSeleccionado as ValorFloatDTORespuesta).valor = value as number;
        }
      }
      this.parameterChange.emit(updatedParametro);
    });
  }

  trackByOption(index: number, option: SelectOption): any {
    return option.enum ?? index;
  }

  get inputType(): string {
    return this.parametro().objValorSeleccionado.enumTipoValor === EnumTipoValor.INTEGER ? 'number' : 'text';
  }
}
