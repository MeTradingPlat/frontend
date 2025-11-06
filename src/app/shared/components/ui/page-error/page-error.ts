import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-error',
  standalone: true,
  imports: [],
  templateUrl: './page-error.html',
  styleUrl: './page-error.scss'
})
export class PageError {
  message = input<string>('');
  reload = output();

  reloadPage(): void {
    this.reload.emit();
  }
}
