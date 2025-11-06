import { ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from "@angular/material/card";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroupDirective, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Escaner } from '../../../models/escaner.interface';

/** Custom error state matcher that shows errors when errorMessage is present */
class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private hasError: () => boolean) {}

  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return this.hasError();
  }
}

@Component({
  selector: 'app-card-general',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './card-general.html',
  styleUrl: './card-general.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardGeneral {
  scanner = model.required<Escaner>();
  errors = input<Record<string, string>>({});

  // FormControls for Material error state
  nombreControl = new FormControl();
  descripcionControl = new FormControl();

  // Error state matchers
  nombreErrorMatcher = new CustomErrorStateMatcher(() => !!this.errors()['nombre']);
  descripcionErrorMatcher = new CustomErrorStateMatcher(() => !!this.errors()['descripcion']);

  constructor() {
    // Sync FormControl values with the model
    effect(() => {
      const scannerValue = this.scanner();
      this.nombreControl.setValue(scannerValue.nombre, { emitEvent: false });
      this.descripcionControl.setValue(scannerValue.descripcion, { emitEvent: false });
    });

    // Sync changes back to model
    this.nombreControl.valueChanges.subscribe(value => {
      this.scanner.update(s => ({ ...s, nombre: value }));
    });

    this.descripcionControl.valueChanges.subscribe(value => {
      this.scanner.update(s => ({ ...s, descripcion: value }));
    });
  }
}
