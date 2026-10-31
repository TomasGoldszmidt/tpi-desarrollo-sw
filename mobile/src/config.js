import Constants from 'expo-constants';

const BACKEND_PORT = 3000;

// En desarrollo, Expo expone la IP de la PC que corre el bundler (ej: "192.168.1.10:8081").
// Se reutiliza esa IP para llegar al backend, así no hay que hardcodearla.
// EXPO_PUBLIC_API_URL permite forzar otra URL si hace falta.
function resolverApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:${BACKEND_PORT}`;
}

export const API_URL = resolverApiUrl();
