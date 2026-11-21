import * as favoritoService from '../services/favoritoService.js';
import { requireId } from '../http/validation.js';

export async function list(req, res) {
  res.status(200).json(favoritoService.favoritosDe(req.usuario, requireId(req.params.id)));
}

export async function add(req, res) {
  const id = requireId(req.params.id);
  favoritoService.marcarFavorito(req.usuario, id, requireId(req.params.eventoId, 'eventoId'));
  res.status(204).end();
}

export async function remove(req, res) {
  const id = requireId(req.params.id);
  favoritoService.desmarcarFavorito(req.usuario, id, requireId(req.params.eventoId, 'eventoId'));
  res.status(204).end();
}
