import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import { eventosFavoritos } from './evento.js';
import { ForbiddenError, NotFoundError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */

// Favoritos del usuario (`Usuario.favoritos` del diagrama). Son privados: solo el propio
// usuario los ve y los cambia. Marcar y desmarcar se pueden repetir sin error.

function verificarPropio(usuarioActivo, id) {
  if (usuarioActivo.id !== id) {
    throw new ForbiddenError('Solo podés ver y cambiar tus propios favoritos.');
  }
}

/** @param {Usuario} usuarioActivo */
export function listarFavoritos(usuarioActivo, id) {
  verificarPropio(usuarioActivo, id);
  return eventosFavoritos(usuarioRepository.findById(id));
}

/** @param {Usuario} usuarioActivo */
export function marcarFavorito(usuarioActivo, id, eventoId) {
  verificarPropio(usuarioActivo, id);
  if (!eventoRepository.findById(eventoId)) throw new NotFoundError(`No existe el evento ${eventoId}`);
  usuarioRepository.addFavorito(id, eventoId);
}

// Quitar uno que no estaba no es un error: el resultado es el mismo.
/** @param {Usuario} usuarioActivo */
export function desmarcarFavorito(usuarioActivo, id, eventoId) {
  verificarPropio(usuarioActivo, id);
  usuarioRepository.removeFavorito(id, eventoId);
}
