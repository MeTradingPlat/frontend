import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Parametro } from '../../../../models/parametro.interface';
import { ValorCondicional } from '../../../../models/valor-condicional.interface';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';

class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private errorMessage: () => string | undefined) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!this.errorMessage();
  }
}

@Component({
  selector: 'app-conditional-parameter',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './conditional-parameter.html',
  styleUrl: './conditional-parameter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionalParameter {
  parametro = model.required<Parametro>();
  errorMessage = input<string | undefined>();

  errorStateMatcher!: ErrorStateMatcher;

  constructor() {
    this.errorStateMatcher = new CustomErrorStateMatcher(this.errorMessage);
  }

  get valorCondicional(): ValorCondicional {
    return this.parametro().objValorSeleccionado as ValorCondicional;
  }

  // Computed para determinar el tipo de input basado en isInteger
  inputType = computed(() => this.valorCondicional.isInteger ? 'number' : 'number');

  // Computed para determinar el step del input
  inputStep = computed(() => this.valorCondicional.isInteger ? '1' : '0.01');

  /**
   * Verifica si el condicional requiere dos valores
   * Solo ENTRE y FUERA requieren dos valores
   */
  requiresValor2 = computed(() => {
    const enumCondicional = this.valorCondicional.enumCondicional;
    return enumCondicional === 'ENTRE' || enumCondicional === 'FUERA';
  });

  /**
   * Obtiene el valor correcto de una opción
   * Para condicionales, las opciones son ValorString donde el valor está en la propiedad 'valor'
   */
  getOpcionValue(opcion: any): string {
    // Las opciones de condicionales son ValorString con el condicional en 'valor'
    if (opcion && 'valor' in opcion && opcion.valor) {
      return opcion.valor;
    }
    // Fallback por si acaso
    if (opcion && 'enumCondicional' in opcion && opcion.enumCondicional) {
      return opcion.enumCondicional;
    }
    return opcion?.enumTipoValor || '';
  }

  onCondicionalChange(newEnumCondicional: string): void {
    const currentParam = this.parametro();
    const valorCond = currentParam.objValorSeleccionado as ValorCondicional;
    const opcionSeleccionada = currentParam.opciones.find(
      opt => this.getOpcionValue(opt) === newEnumCondicional
    );

    if (opcionSeleccionada) {
      const requiresValor2 = this.checkRequiresValor2(newEnumCondicional);

      // Las opciones son ValorString, necesitamos construir un ValorCondicional
      const nuevoValorCondicional: ValorCondicional = {
        enumTipoValor: 'CONDICIONAL', // Siempre CONDICIONAL para este tipo
        etiqueta: opcionSeleccionada.etiqueta,
        enumCondicional: newEnumCondicional, // El valor del condicional (MAYOR_QUE, ENTRE, etc.)
        isInteger: valorCond.isInteger, // Mantener el tipo de dato actual
        valor1: valorCond.valor1, // Mantener valor1 actual
        valor2: requiresValor2 ? (valorCond.valor2 ?? valorCond.valor1 ?? 0) : undefined // Inicializar valor2 si es necesario
      };

      this.parametro.set({
        ...currentParam,
        objValorSeleccionado: nuevoValorCondicional
      });
    }
  }

  onValor1Change(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value;
    const currentParam = this.parametro();
    const valorCond = currentParam.objValorSeleccionado as ValorCondicional;

    // Convertir a número
    let numericValue = parseFloat(newValue);

    // Si es float (no integer) y el valor no tiene decimales, asegurarse de que sea float
    if (!valorCond.isInteger && Number.isInteger(numericValue)) {
      numericValue = parseFloat(numericValue.toFixed(1)); // Asegurar que sea float (ej: 122 -> 122.0)
    } else if (valorCond.isInteger) {
      numericValue = Math.round(numericValue); // Asegurar que sea entero
    }

    this.parametro.set({
      ...currentParam,
      objValorSeleccionado: {
        ...valorCond,
        valor1: numericValue
      }
    });
  }

  onValor2Change(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input.value;
    const currentParam = this.parametro();
    const valorCond = currentParam.objValorSeleccionado as ValorCondicional;

    // Convertir a número
    let numericValue = parseFloat(newValue);

    // Si es float (no integer) y el valor no tiene decimales, asegurarse de que sea float
    if (!valorCond.isInteger && Number.isInteger(numericValue)) {
      numericValue = parseFloat(numericValue.toFixed(1)); // Asegurar que sea float (ej: 122 -> 122.0)
    } else if (valorCond.isInteger) {
      numericValue = Math.round(numericValue); // Asegurar que sea entero
    }

    this.parametro.set({
      ...currentParam,
      objValorSeleccionado: {
        ...valorCond,
        valor2: numericValue
      }
    });
  }

  private checkRequiresValor2(enumCondicional: string): boolean {
    return enumCondicional === 'ENTRE' || enumCondicional === 'FUERA';
  }
}
