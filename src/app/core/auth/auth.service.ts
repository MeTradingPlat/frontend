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
        if (user.token === token) {
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
    return !!this.getToken();
  }

  isEditor(): boolean {
    const user = this.currentUser();
    return user ? user.roles.includes('ROLE_EDITOR') : false;
  }
}
