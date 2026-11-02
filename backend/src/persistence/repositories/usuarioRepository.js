import { Collection } from '../collection.js';

/** @typedef {import('../schemas.js').Usuario} Usuario */

const usuarios = new Collection();

/** @returns {Usuario} */
export function create({ nombre, apellido }) {
  return usuarios.insert({ nombre, apellido, favoritos: [] });
}

/** @returns {Usuario | null} */
export function findById(id) {
  return usuarios.findById(id);
}

/** @returns {Usuario[]} */
export function findAll() {
  return usuarios.findAll();
}

/** @returns {Usuario | null} */
export function addFavorito(usuarioId, eventoId) {
  const usuario = usuarios.findById(usuarioId);
  if (!usuario) return null;
  if (usuario.favoritos.includes(Number(eventoId))) return usuario;

  return usuarios.update(usuarioId, {
    favoritos: [...usuario.favoritos, Number(eventoId)],
  });
}

/** @returns {Usuario | null} */
export function removeFavorito(usuarioId, eventoId) {
  const usuario = usuarios.findById(usuarioId);
  if (!usuario) return null;

  return usuarios.update(usuarioId, {
    favoritos: usuario.favoritos.filter((id) => id !== Number(eventoId)),
  });
}
