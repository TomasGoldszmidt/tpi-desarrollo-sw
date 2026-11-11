import { request } from './client.js';

// De la más reciente a la más vieja, cada una con `leida`.
export function getNotificaciones(usuarioId) {
  return request(`/usuarios/${usuarioId}/notificaciones`);
}

// Todas las que hay hasta ahora quedan como leídas.
export function marcarNotificacionesLeidas(usuarioId) {
  return request(`/usuarios/${usuarioId}/notificaciones/lectura`, { method: 'PUT' });
}

// Solo esa notificación queda leída (al abrirla).
export function marcarNotificacionLeida(usuarioId, notificacionId) {
  return request(`/usuarios/${usuarioId}/notificaciones/${encodeURIComponent(notificacionId)}/lectura`, { method: 'PUT' });
}
