import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'escaner/expandir/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [{ id: '1' }];
    },
  },
  {
    path: 'escaner/configuracion/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [{ id: '1' }];
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
