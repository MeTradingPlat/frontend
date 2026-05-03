import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Si no es admin pero está autenticado, redirigir a inicio
  if (authService.isAuthenticated()) {
      router.navigate(['/inicio']);
      return false;
  }

  // Si no está autenticado, redirigir a login
  router.navigate(['/login']);
  return false;
};
