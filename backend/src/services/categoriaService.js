import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';

export function listarCategorias() {
  return categoriaRepository.findAll();
}
