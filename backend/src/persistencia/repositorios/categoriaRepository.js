import { Coleccion } from '../coleccion.js';

/** @typedef {import('../esquemas.js').Categoria} Categoria */

const categorias = new Coleccion();

/** @returns {Categoria} */
export function crear({ nombre, descripcion }) {
  return categorias.insertar({ nombre, descripcion });
}

/** @returns {Categoria | null} */
export function buscarPorId(id) {
  return categorias.buscarPorId(id);
}

/** @returns {Categoria[]} */
export function buscarTodos() {
  return categorias.buscarTodos();
}
