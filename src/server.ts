import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const buildId = process.env['BUILD_ID'] || String(Date.now());

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Health check endpoint for Docker healthcheck
 */
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/**
 * Lets the running app detect a newer deploy while a tab stays open on an
 * old computer that never gets restarted -- BUILD_ID changes every deploy
 * (see Dockerfile/CI), this never does, so it must never be cached.
 */
app.get('/version.json', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ buildId });
});

/**
 * Push channel for near-instant deploy detection: a deploy kills this
 * process (docker rm -f), which drops every open connection here -- the
 * browser's EventSource auto-reconnects, and whichever container answers
 * next writes ITS OWN buildId immediately on connect. No polling delay:
 * detection latency is just the reconnect + new container start time.
 * version.json stays as the periodic fallback for proxies that mishandle SSE.
 */
app.get('/version-events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ buildId })}\n\n`);
  const ping = setInterval(() => res.write(':ping\n\n'), 30000);
  req.on('close', () => clearInterval(ping));
});

/**
 * /assets (i18n JSON, images, etc.) keeps its URL across builds -- unlike
 * the hashed JS/CSS bundles below, a content change here is invisible to a
 * browser holding a long-lived cache, so it gets a short one instead.
 */
app.use('/assets', express.static(join(browserDistFolder, 'assets'), {
  maxAge: '5m',
  index: false,
}));

/**
 * Serve static files from /browser directory
 */
app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  index: false,
}));

/**
 * Handle all other requests by rendering the Angular application.
 * no-store on the shell HTML itself: old browsers/corporate proxies that
 * heuristically cache unlabeled responses are exactly the ones stranding
 * non-technical users on a stale build.
 */
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4200.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4200;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
