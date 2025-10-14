import { Component, input, output } from '@angular/core';
import { CategoriaDTORespuesta } from '../../../../models/categoria.model';

@Component({
  selector: 'app-filter-button',
  standalone: true,
  templateUrl: './filter-button.html',
  styleUrl: './filter-button.css'
})
export class FilterButton {
  category = input<CategoriaDTORespuesta>();
  iconClass = input<string | undefined>(undefined);
  isSelected = input<boolean>(false);
  buttonSelected = output<CategoriaDTORespuesta>();

  onClick(): void {
    if (this.category()) {
      this.buttonSelected.emit(this.category()!);
    }
  }
}
