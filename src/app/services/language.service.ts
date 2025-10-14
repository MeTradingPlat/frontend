import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  // This signal would typically be updated by a language switcher component or browser settings
  private currentLanguage = signal<string>('es'); // Default to Spanish

  getCurrentLanguage(): string {
    return this.currentLanguage();
  }

  setLanguage(language: string): void {
    this.currentLanguage.set(language);
    // In a real application, you would also save this preference (e.g., to localStorage)
    // and potentially reload translations.
  }

  getTranslation(key: string): string {
    // For now, just return the key. In a real app, this would fetch from a translation file.
    return key;
  }
}