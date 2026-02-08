export const environment = {
  production: true,
  apiUrl: 'https://sse.metradingplat.com/api',  // Usar subdominio SSE para evitar timeout de Cloudflare
  // Token para autenticación SSE
  // IMPORTANTE: Cambiar este valor en el servidor usando variable de entorno SSE_AUTH_TOKEN
  sseAuthToken: 'CHANGE_THIS_IN_PRODUCTION'
};