import { request } from './client.js';

export function getUsuarios() {
  return request('/usuarios');
}

// Un usuario con su puntaje como organizador (puntaje null si no tiene reseñas).
export function getUsuario(id) {
  return request(`/usuarios/${id}`);
}

// Las reseñas de los eventos que organiza, de la más reciente a la más vieja.
export function getReseniasOrganizador(id) {
  return request(`/usuarios/${id}/resenias`);
}
