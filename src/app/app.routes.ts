import { Routes } from '@angular/router';
import { Scanner } from './scanner/scanner';
import { SetUpScanner } from './set-up-scanner/set-up-scanner';

export const routes: Routes = [
    { path: 'escaner', component: Scanner },
    { path: 'escaner/nuevo', component: SetUpScanner },
    { path: 'escaner/configuracion/:id', component: SetUpScanner }
];
