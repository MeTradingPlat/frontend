import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-load-page',
  templateUrl: './load-page.html',
  styleUrl: './load-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'load-page-host'
  }
})
export class LoadPage {

}
