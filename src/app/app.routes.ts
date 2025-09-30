import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Scanner } from './pages/scanner/scanner';
import { ScannerConfiguration } from './pages/scanner-configuration/scanner-configuration';
import { News } from './pages/news/news';
import { ScannerArchived } from './pages/scanner-archived/scanner-archived';
import { ScannerExpand } from './pages/scanner-expand/scanner-expand';

export const routes: Routes = [
    { path: '', redirectTo: '/inicio', pathMatch: 'full' },
    { path: 'inicio', component: Home },
    { path: 'escaner', component: Scanner },
    { path: 'escaner/archivados', component: ScannerArchived },
    { path: 'escaner/expandir/:id', component: ScannerExpand },
    { path: 'escaner/configuracion/:id', component: ScannerConfiguration },
    { path: 'escaner/nuevo', component: ScannerConfiguration },
    { path: 'noticias', component: News },
];
