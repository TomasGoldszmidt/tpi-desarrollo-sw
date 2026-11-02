import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';

export async function list(req, res) {
  res.status(200).json(usuarioRepository.findAll());
}
