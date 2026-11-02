import { Coleccion } from '../coleccion.js';

/** @typedef {import('../esquemas.js').Usuario} Usuario */

const usuarios = new Coleccion();

/** @returns {Usuario} */
export function crear({ nombre, apellido }) {
  return usuarios.insertar({ nombre, apellido, favoritos: [] });
}

/** @returns {Usuario | null} */
export function buscarPorId(id) {
  return usuarios.buscarPorId(id);
}

/** @returns {Usuario[]} */
export function buscarTodos() {
  return usuarios.buscarTodos();
}

/** @returns {Usuario | null} */
export function agregarFavorito(usuarioId, eventoId) {
  const usuario = usuarios.buscarPorId(usuarioId);
  if (!usuario) return null;
  if (usuario.favoritos.includes(Number(eventoId))) return usuario;

  return usuarios.actualizar(usuarioId, {
    favoritos: [...usuario.favoritos, Number(eventoId)],
  });
}

/** @returns {Usuario | null} */
export function quitarFavorito(usuarioId, eventoId) {
  const usuario = usuarios.buscarPorId(usuarioId);
  if (!usuario) return null;

  return usuarios.actualizar(usuarioId, {
    favoritos: usuario.favoritos.filter((id) => id !== Number(eventoId)),
  });
}
