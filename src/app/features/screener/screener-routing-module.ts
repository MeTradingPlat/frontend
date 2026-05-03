import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ScreenerComponent } from './pages/screener/screener.component';

const routes: Routes = [
  {
    path: '',
    component: ScreenerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScreenerRoutingModule { }
