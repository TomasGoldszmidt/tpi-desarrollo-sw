import * as categoriaService from '../services/categoriaService.js';

export async function list(req, res) {
  res.status(200).json(categoriaService.listarCategorias());
}
