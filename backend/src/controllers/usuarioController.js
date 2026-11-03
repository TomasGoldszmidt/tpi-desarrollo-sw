import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { perfilUsuario } from '../domain/resenia.js';
import { NotFoundError } from '../http/errors.js';
import { requireId } from '../http/validation.js';

export async function list(req, res) {
  res.status(200).json(usuarioRepository.findAll());
}

// Público: lo usa la pantalla de reseñas del organizador para mostrar su nombre y puntaje.
export async function getById(req, res) {
  const id = requireId(req.params.id);
  const usuario = usuarioRepository.findById(id);
  if (!usuario) throw new NotFoundError(`No existe el usuario ${id}`);
  res.status(200).json(perfilUsuario(usuario));
}
