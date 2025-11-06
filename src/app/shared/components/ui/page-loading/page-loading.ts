import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-page-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './page-loading.html',
  styleUrl: './page-loading.scss'
})
export class PageLoading {

}
