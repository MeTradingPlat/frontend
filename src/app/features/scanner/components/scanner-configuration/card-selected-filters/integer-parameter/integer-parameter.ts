import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Parametro } from '../../../../models/parametro.interface';
import { ValorInteger } from '../../../../models/valor-integer.interface';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';

class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private errorMessage: () => string | undefined) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!this.errorMessage();
  }
}

@Component({
  selector: 'app-integer-parameter',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './integer-parameter.html',
  styleUrl: './integer-parameter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IntegerParameter {
  parametro = model.required<Parametro>();
  errorMessage = input<string | undefined>();

  errorStateMatcher!: ErrorStateMatcher;

  constructor() {
    this.errorStateMatcher = new CustomErrorStateMatcher(this.errorMessage);
  }

  get valorInteger(): ValorInteger {
    return this.parametro().objValorSeleccionado as ValorInteger;
  }

  onValueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = parseInt(input.value, 10);
    const currentParam = this.parametro();
    const valorInteger = currentParam.objValorSeleccionado as ValorInteger;

    this.parametro.set({
      ...currentParam,
      objValorSeleccionado: {
        ...valorInteger,
        valor: newValue
      }
    });
  }
}
