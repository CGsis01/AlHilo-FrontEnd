// Environment configuration for production
export const environment = {
  production: true,
  apiUrl: 'https://al-hilo-back-end.vercel.app/api/v1',  // Update with your production API URL
  apiTimeout: 30000,
  tokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken',
  userKey: 'currentUser',
};
