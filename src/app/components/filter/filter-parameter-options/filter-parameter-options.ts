import { Component, input, output, computed, ChangeDetectionStrategy, effect, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { ParametroDTORespuesta } from '../../../models/parametro.model';
import { ValorStringDTORespuesta } from '../../../models/valor.model';
import { FormSelect } from '../../forms/form-select/form-select';

interface SelectOption {
  key: string;
  value: string;
}

@Component({
  selector: 'app-filter-parameter-options',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormSelect],
  templateUrl: './filter-parameter-options.html',
  styleUrl: './filter-parameter-options.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterParameterOptions implements OnInit {
  private fb = inject(FormBuilder);

  protected Validators = Validators;
  optionForm!: FormGroup;

  submitted = input(false);
  parametro = input.required<ParametroDTORespuesta>();
  cardDataChange = output<{ cardType: ParametroDTORespuesta, data: any }>();
  parameterChange = output<ParametroDTORespuesta>();

  get valueControl(): FormControl {
    // Ensure optionForm is initialized before accessing its controls
    if (!this.optionForm) {
      return new FormControl(null); // Return a dummy control or handle as appropriate, using null for no selection
    }
    return this.optionForm.get('options-select') as FormControl;
  }

  selectOptions = computed<SelectOption[]>(() => {
    const options = this.parametro().opciones.map(option => {
      // As per user's clarification, 'valor' is always present and unique for the key.
      const valor = (option as ValorStringDTORespuesta).valor;
      return {
        key: valor,
        value: option.etiqueta
      };
    });
    return options;
  });

  constructor() {
    effect(() => {
      const parametro = this.parametro();

      // Only patch value if the form is initialized
      if (this.optionForm) {
        const selectedValue = (parametro.objValorSeleccionado as ValorStringDTORespuesta)?.valor;
        this.valueControl.setValue(selectedValue || null, { emitEvent: false }); // Set to null if no value
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm(this.parametro());
    this.setupFormListeners();
  }

  private initializeForm(parametro: ParametroDTORespuesta): void {
    const selectedValue = (parametro.objValorSeleccionado as ValorStringDTORespuesta)?.valor;
    this.optionForm = this.fb.group({
      'options-select': [selectedValue || null, Validators.required], // Set to null if no value
    });
  }

  private setupFormListeners(): void {
    this.optionForm.valueChanges.subscribe(value => {
      const updatedParametro = { ...this.parametro() };
      (updatedParametro.objValorSeleccionado as ValorStringDTORespuesta).valor = value['options-select'] as string;
      this.parameterChange.emit(updatedParametro);
    });
  }

  trackByOption(index: number, option: SelectOption): any {
    return option.key ?? index;
  }
}
