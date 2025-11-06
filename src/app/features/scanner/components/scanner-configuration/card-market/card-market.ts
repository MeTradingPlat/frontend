import { ChangeDetectionStrategy, Component, effect, inject, input, model } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { TranslatePipe } from "@ngx-translate/core";
import { Escaner } from "../../../models/escaner.interface";
import { Mercado } from "../../../models/mercado.interface";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'app-card-market',
  imports: [FormsModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, TranslatePipe],
  templateUrl: './card-market.html',
  styleUrl: './card-market.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMarket {
  scanner = model.required<Escaner>();
  mercados = input.required<Mercado[]>();
  errors = input<Record<string, string>>({});

  private readonly _formBuilder = inject(FormBuilder);

  marketsForm = this._formBuilder.group({});

  constructor() {
    // Inicializar el formulario cuando cambien los mercados
    effect(() => {
      const mercadosActuales = this.mercados();
      const scanner = this.scanner();

      // Crear el objeto con los controles
      const controls: any = {};

      mercadosActuales.forEach(mercado => {
        // Verificar si el mercado está en el escáner
        const isSelected = scanner.mercados.some(
          m => m.enumMercado === mercado.enumMercado
        );
        controls[mercado.enumMercado] = [isSelected];
      });

      // Recrear el formulario
      this.marketsForm = this._formBuilder.group(controls);

      // Si no hay mercados seleccionados en el escáner, seleccionar el primero por defecto
      if (scanner.mercados.length === 0 && mercadosActuales.length > 0) {
        const primerMercado = mercadosActuales[0];
        this.marketsForm.patchValue({ [primerMercado.enumMercado]: true });
        this.actualizarEscaner();
      }

      // Actualizar el estado deshabilitado de los controles
      this.actualizarEstadoControles();
    });
  }

  onCheckboxChange(): void {
    this.actualizarEscaner();
    this.actualizarEstadoControles();
  }

  // Actualiza el estado deshabilitado de los controles
  private actualizarEstadoControles(): void {
    const scanner = this.scanner();
    const mercadosActuales = this.mercados();
    const soloUnSeleccionado = scanner.mercados.length === 1;

    mercadosActuales.forEach(mercado => {
      const control = this.marketsForm.get(mercado.enumMercado);
      if (!control) return;

      const isSelected = scanner.mercados.some(m => m.enumMercado === mercado.enumMercado);

      // Solo deshabilitar si este mercado está seleccionado Y es el único seleccionado
      if (isSelected && soloUnSeleccionado) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });
  }

  private actualizarEscaner(): void {
    // Usar getRawValue() para incluir controles deshabilitados
    const formValue = this.marketsForm.getRawValue();

    // Obtener los mercados seleccionados
    let mercadosSeleccionados: Mercado[] = Object.entries(formValue)
      .filter(([_, isSelected]) => isSelected === true)
      .map(([enumMercado]) => ({ enumMercado }));

    // Prevenir que se deseleccionen todos los mercados
    // Si no hay mercados seleccionados, seleccionar el primero de la lista disponible
    if (mercadosSeleccionados.length === 0) {
      const mercadosDisponibles = this.mercados();
      if (mercadosDisponibles.length > 0) {
        const primerMercado = mercadosDisponibles[0];
        const control = this.marketsForm.get(primerMercado.enumMercado);

        // Habilitar temporalmente para actualizar el valor
        const wasDisabled = control?.disabled;
        if (wasDisabled) {
          control?.enable({ emitEvent: false });
        }

        // Actualizar el formulario para marcar el primer mercado como seleccionado
        this.marketsForm.patchValue({ [primerMercado.enumMercado]: true }, { emitEvent: false });

        // Agregar el primer mercado a la lista de seleccionados
        mercadosSeleccionados = [{ enumMercado: primerMercado.enumMercado }];
      } else {
        return;
      }
    }

    // Actualizar el escáner
    this.scanner.update(s => ({
      ...s,
      mercados: mercadosSeleccionados
    }));
  }
}
