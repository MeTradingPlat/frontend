import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Parametro } from '../../../../models/parametro.interface';
import { ValorFloat } from '../../../../models/valor-float.interface';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';

class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private errorMessage: () => string | undefined) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!this.errorMessage();
  }
}

@Component({
  selector: 'app-float-parameter',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './float-parameter.html',
  styleUrl: './float-parameter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatParameter {
  parametro = model.required<Parametro>();
  errorMessage = input<string | undefined>();

  errorStateMatcher!: ErrorStateMatcher;

  constructor() {
    this.errorStateMatcher = new CustomErrorStateMatcher(this.errorMessage);
  }

  get valorFloat(): ValorFloat {
    return this.parametro().objValorSeleccionado as ValorFloat;
  }

  onValueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseFloat(input.value);
    const currentParam = this.parametro();
    const valorFloat = currentParam.objValorSeleccionado as ValorFloat;

    this.parametro.set({
      ...currentParam,
      objValorSeleccionado: {
        ...valorFloat,
        valor: newValue
      }
    });
  }
}
