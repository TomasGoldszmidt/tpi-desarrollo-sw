import { request } from './client.js';

// Primero las nuevas y cada grupo de la más reciente a la más vieja, con `leida`. Vienen de a
// páginas: { resultados, pagina, limite, total, hayMas, noLeidas } (noLeidas cuenta todas).
export function getNotificaciones(usuarioId, { pagina = 1, limite = 10 } = {}) {
  return request(`/usuarios/${usuarioId}/notificaciones?pagina=${pagina}&limite=${limite}`);
}

// Todas las que hay hasta ahora quedan como leídas.
export function marcarNotificacionesLeidas(usuarioId) {
  return request(`/usuarios/${usuarioId}/notificaciones/lectura`, { method: 'PUT' });
}

// Solo esa notificación queda leída (al abrirla).
export function marcarNotificacionLeida(usuarioId, notificacionId) {
  return request(`/usuarios/${usuarioId}/notificaciones/${encodeURIComponent(notificacionId)}/lectura`, { method: 'PUT' });
}
