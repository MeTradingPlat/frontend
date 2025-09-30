import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDarkMode = signal(false);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    if (this.isBrowser) {
      // Initialize theme from localStorage or default to light
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.isDarkMode.set(true);
      }

      // Effect to apply theme class to body and save to localStorage
      effect(() => {
        if (this.isDarkMode()) {
          document.documentElement.classList.add('theme-dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('theme-dark');
          localStorage.setItem('theme', 'light');
        }
      });
    }
  }

  toggleTheme(): void {
    this.isDarkMode.update(currentMode => !currentMode);
  }
}