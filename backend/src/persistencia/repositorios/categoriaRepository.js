import { Coleccion } from '../coleccion.js';

// Documento: { id, nombre, descripcion }
// Solo lectura para la API: las categorías las carga el seed.
const categorias = new Coleccion();

export function crear({ nombre, descripcion }) {
  return categorias.insertar({ nombre, descripcion });
}

export function buscarPorId(id) {
  return categorias.buscarPorId(id);
}

export function buscarTodos() {
  return categorias.buscarTodos();
}
