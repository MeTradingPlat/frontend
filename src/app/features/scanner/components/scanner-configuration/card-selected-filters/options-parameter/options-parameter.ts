import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Parametro } from '../../../../models/parametro.interface';
import { ValorString } from '../../../../models/valor-string.interface';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';

class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private errorMessage: () => string | undefined) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!this.errorMessage();
  }
}

@Component({
  selector: 'app-options-parameter',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './options-parameter.html',
  styleUrl: './options-parameter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionsParameter {
  parametro = model.required<Parametro>();
  errorMessage = input<string | undefined>();

  errorStateMatcher!: ErrorStateMatcher;

  constructor() {
    this.errorStateMatcher = new CustomErrorStateMatcher(this.errorMessage);
  }

  get valorString(): ValorString {
    return this.parametro().objValorSeleccionado as ValorString;
  }

  onValueChange(newEnumTipoValor: string): void {
    const currentParam = this.parametro();
    // Buscar la opción seleccionada para obtener su etiqueta
    const opcionSeleccionada = currentParam.opciones.find(
      opt => opt.enumTipoValor === newEnumTipoValor
    );

    if (opcionSeleccionada) {
      this.parametro.set({
        ...currentParam,
        objValorSeleccionado: opcionSeleccionada as ValorString
      });
    }
  }
}
