import { Component, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-load-page-error',
  templateUrl: './load-page-error.html',
  styleUrl: './load-page-error.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'load-page-error-host'
  }
})
export class LoadPageError {
  readonly reload = output();

  reloadPage(): void {
    this.reload.emit();
  }
}
