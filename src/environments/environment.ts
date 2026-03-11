// Environment configuration for development
export const environment = {
  production: false,
  // apiUrl: 'http://192.168.68.116:8000/api/v1',  // FastAPI default port
  apiUrl: 'https://al-hilo-back-end.vercel.app/api/v1',  // FastAPI default port
  apiTimeout: 30000,  // 30 seconds
  tokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken',
  userKey: 'currentUser'
};
