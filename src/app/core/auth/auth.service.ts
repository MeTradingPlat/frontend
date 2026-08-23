import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  
  // Usamos signals para que la UI reaccione automáticamente
  public currentUser = signal<LoginResponse | null>(null);

  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private router: Router) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserFromStorage();
    }
  }

  private loadUserFromStorage() {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        // Sin esto, un token vencido (ej. abrir la app tras varios dias sin
        // usarla -- el backend los emite con 3 dias de validez) dejaba
        // entrar igual: isAuthenticated() solo miraba si HABIA un string en
        // localStorage, nunca si seguia siendo valido. El usuario recien se
        // enteraba al chocar con un 401 en la primera llamada real (ej. al
        // abrir Escaneres), en vez de quedar fuera desde el arranque.
        if (user.token === token && !this.isTokenExpired(token)) {
          this.currentUser.set(user);
        } else {
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    } else {
      this.currentUser.set(null);
    }
  }

  // Decodifica el payload del JWT (segundo segmento, base64url) para leer
  // "exp" sin depender de una libreria -- el token es autocontenido, no
  // hace falta preguntarle al backend si ya vencio.
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  login(credentials: any) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('user', JSON.stringify(response));
          localStorage.setItem('token', response.token);
        }
        this.currentUser.set(response);
      })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isEditor(): boolean {
    const user = this.currentUser();
    return user ? user.roles.includes('ROLE_EDITOR') : false;
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some((r: any) => {
      const roleStr = typeof r === 'string' ? r : (r.authority || r.role || '');
      const upperRole = roleStr.toUpperCase();
      return upperRole.includes('ADMIN') || upperRole.includes('EDITOR');
    });
  }
}
