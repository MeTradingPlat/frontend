import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/login/login.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'inicio',
        loadChildren: () => import('./features/home/home-routing-module').then(m => m.HomeRoutingModule)
    },
    {
        path: 'escaneres',
        canActivate: [authGuard],
        loadChildren: () => import('./features/scanner/scanner-routing-module').then(m => m.ScannerRoutingModule)
    },
    {
        path: 'noticias',
        canActivate: [authGuard],
        loadChildren: () => import('./features/news/news-routing-module').then(m => m.NewsRoutingModule)
    },
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: '**', redirectTo: 'inicio'},
];
