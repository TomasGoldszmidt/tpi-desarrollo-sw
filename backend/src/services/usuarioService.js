import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { NotFoundError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */

// Búsquedas de usuarios que usan los demás services.

/** @returns {Usuario} */
export function buscarUsuario(id) {
  const usuario = usuarioRepository.findById(id);
  if (!usuario) throw new NotFoundError(`No existe el usuario ${id}`);
  return usuario;
}

// Los usuarios por id, para poner nombres (autores de mensajes, compradores de reseñas, organizadores).
/** @returns {Map<number, Usuario>} */
export function usuariosPorId() {
  return new Map(usuarioRepository.findAll().map((usuario) => [usuario.id, usuario]));
}

/** @returns {Usuario[]} */
export function listarUsuarios() {
  return usuarioRepository.findAll();
}
