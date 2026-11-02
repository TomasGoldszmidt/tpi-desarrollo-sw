import { Collection } from '../collection.js';

/** @typedef {import('../schemas.js').Categoria} Categoria */

const categorias = new Collection();

/** @returns {Categoria} */
export function create({ nombre, descripcion }) {
  return categorias.insert({ nombre, descripcion });
}

/** @returns {Categoria | null} */
export function findById(id) {
  return categorias.findById(id);
}

/** @returns {Categoria[]} */
export function findAll() {
  return categorias.findAll();
}
