import { request } from './client.js';

export function getUsuarios() {
  return request('/usuarios');
}

// Registro: crea la cuenta y la devuelve con el email.
export function crearUsuario({ nombre, apellido, email, contrasenia }) {
  return request('/usuarios', { method: 'POST', body: { nombre, apellido, email, contrasenia } });
}

// Edición del perfil: solo los campos que cambian. Devuelve la cuenta actualizada.
export function actualizarUsuario(id, cambios) {
  return request(`/usuarios/${id}`, { method: 'PATCH', body: cambios });
}

// Un usuario con su puntaje como organizador (puntaje null si no tiene reseñas).
export function getUsuario(id) {
  return request(`/usuarios/${id}`);
}

// Las reseñas de los eventos que organiza, de la más reciente a la más vieja.
export function getReseniasOrganizador(id) {
  return request(`/usuarios/${id}/resenias`);
}

// Los eventos que organiza, incluidos los que ya se realizaron, ordenados por fecha.
export function getEventosOrganizador(id) {
  return request(`/usuarios/${id}/eventos`);
}
