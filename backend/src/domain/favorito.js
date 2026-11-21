import { ForbiddenError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */

// Favoritos del usuario (`Usuario.favoritos` del diagrama). Son privados: solo el propio
// usuario los ve y los cambia. Marcar y desmarcar se pueden repetir sin error (eso lo
// resuelve el repositorio, que no duplica ni falla si no estaba).

/** @param {Usuario} usuarioActivo @param {number} id El dueño de los favoritos. */
export function verificarPropios(usuarioActivo, id) {
  if (usuarioActivo.id !== id) {
    throw new ForbiddenError('Solo podés ver y cambiar tus propios favoritos.');
  }
}
