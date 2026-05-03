import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ScreenerRoutingModule } from './screener-routing-module';
import { ScreenerComponent } from './pages/screener/screener.component';
import { SymbolDetailsComponent } from './components/symbol-details/symbol-details.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ScreenerRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatDialogModule,
    TranslateModule,
    ScreenerComponent,
    SymbolDetailsComponent
  ]
})
export class ScreenerModule { }
