import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'inicio',
        loadChildren: () => import('./features/home/home-routing-module').then(m => m.HomeRoutingModule)
    },
    {
        path: 'escaneres',
        loadChildren: () => import('./features/scanner/scanner-routing-module').then(m => m.ScannerRoutingModule)
    },
    {
        path: 'noticias',
        loadChildren: () => import('./features/news/news-routing-module').then(m => m.NewsRoutingModule)
    },
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: '**', redirectTo: 'inicio'},
];
