import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AppVersionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private buildId: string | null = null;

  init(): void {
    if (!this.isBrowser) return;

    this.fetchBuildId().subscribe((id) => (this.buildId = id));
    setInterval(() => this.checkForUpdate(), CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkForUpdate();
    });
  }

  private checkForUpdate(): void {
    if (!this.buildId) return;

    this.fetchBuildId().subscribe((id) => {
      if (id && id !== this.buildId) {
        this.auth.logout();
        window.location.reload();
      }
    });
  }

  private fetchBuildId() {
    return this.http
      .get<{ buildId: string }>(`/version.json?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .pipe(
        map((r) => r.buildId),
        catchError(() => of(null)),
      );
  }
}
