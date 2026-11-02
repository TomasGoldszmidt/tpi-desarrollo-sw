import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';

export async function list(req, res) {
  res.status(200).json(categoriaRepository.findAll());
}
