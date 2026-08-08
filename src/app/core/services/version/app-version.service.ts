import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

const FALLBACK_POLL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AppVersionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private buildId: string | null = null;

  init(): void {
    if (!this.isBrowser) return;

    this.connectToVersionStream();
    setInterval(() => this.pollOnce(), FALLBACK_POLL_MS);
  }

  private connectToVersionStream(): void {
    const source = new EventSource('/version-events');
    source.onerror = () => {};
    source.onmessage = (event) => {
      const { buildId } = JSON.parse(event.data) as { buildId: string };
      if (this.buildId === null) {
        this.buildId = buildId;
      } else if (buildId !== this.buildId) {
        this.forceUpdate();
      }
    };
  }

  private pollOnce(): void {
    if (!this.buildId) return;

    this.http
      .get<{ buildId: string }>(`/version.json?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .pipe(
        map((r) => r.buildId),
        catchError(() => of(null)),
      )
      .subscribe((id) => {
        if (id && id !== this.buildId) this.forceUpdate();
      });
  }

  private forceUpdate(): void {
    this.auth.logout();
    window.location.reload();
  }
}
