import { request } from './client.js';

// Verifica email y contraseña y devuelve la cuenta (el usuario con su email).
export function iniciarSesion(email, contrasenia) {
  return request('/sesiones', { method: 'POST', body: { email, contrasenia } });
}
