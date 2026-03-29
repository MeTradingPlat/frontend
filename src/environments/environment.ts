export const environment = {
  production: false,
  apiUrl: 'https://metradingplat.net/api',
  // Token para autenticación SSE (debe coincidir con SSE_AUTH_TOKEN en backend)
  // TODO: Implementar autenticación JWT para obtener tokens dinámicos por usuario
  sseAuthToken: 'CHANGE_THIS_IN_PRODUCTION'
};