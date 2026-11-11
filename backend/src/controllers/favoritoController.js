import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { desmarcarFavorito, listarFavoritos, marcarFavorito } from '../domain/favorito.js';
import { NotFoundError } from '../http/errors.js';
import { requireId } from '../http/validation.js';

function requireUsuarioExistente(params) {
  const id = requireId(params.id);
  if (!usuarioRepository.findById(id)) throw new NotFoundError(`No existe el usuario ${id}`);
  return id;
}

export async function list(req, res) {
  const id = requireUsuarioExistente(req.params);
  res.status(200).json(listarFavoritos(req.usuario, id));
}

export async function add(req, res) {
  const id = requireUsuarioExistente(req.params);
  marcarFavorito(req.usuario, id, requireId(req.params.eventoId, 'eventoId'));
  res.status(204).end();
}

export async function remove(req, res) {
  const id = requireUsuarioExistente(req.params);
  desmarcarFavorito(req.usuario, id, requireId(req.params.eventoId, 'eventoId'));
  res.status(204).end();
}
