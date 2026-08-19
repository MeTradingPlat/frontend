import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-page-maintenance',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  templateUrl: './page-maintenance.html',
  styleUrl: './page-maintenance.scss'
})
export class PageMaintenance {}
