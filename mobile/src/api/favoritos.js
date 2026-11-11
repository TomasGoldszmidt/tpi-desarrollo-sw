import { request } from './client.js';

// Los eventos favoritos del usuario (con la forma del catálogo), por fecha, incluidos los ya realizados.
export function getFavoritos(usuarioId) {
  return request(`/usuarios/${usuarioId}/favoritos`);
}

export function marcarFavorito(usuarioId, eventoId) {
  return request(`/usuarios/${usuarioId}/favoritos/${eventoId}`, { method: 'PUT' });
}

export function quitarFavorito(usuarioId, eventoId) {
  return request(`/usuarios/${usuarioId}/favoritos/${eventoId}`, { method: 'DELETE' });
}
