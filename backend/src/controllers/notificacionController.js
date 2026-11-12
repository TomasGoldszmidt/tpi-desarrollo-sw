import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { marcarLeida, marcarLeidas, notificacionesDe } from '../domain/notificacion.js';
import { NotFoundError } from '../http/errors.js';
import { requireId } from '../http/validation.js';
import { paginar, parsePagina } from '../http/pagination.js';

function requireUsuarioExistente(params) {
  const id = requireId(params.id);
  if (!usuarioRepository.findById(id)) throw new NotFoundError(`No existe el usuario ${id}`);
  return id;
}

export async function list(req, res) {
  const id = requireUsuarioExistente(req.params);
  const pagina = parsePagina(req.query);
  const notificaciones = notificacionesDe(req.usuario, id);
  // noLeidas cuenta todas, no solo las de esta página: es el número de la campana.
  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;
  res.status(200).json(paginar(notificaciones, pagina, { noLeidas }));
}

export async function markRead(req, res) {
  const id = requireUsuarioExistente(req.params);
  marcarLeidas(req.usuario, id);
  res.status(204).end();
}

export async function markOneRead(req, res) {
  const id = requireUsuarioExistente(req.params);
  marcarLeida(req.usuario, id, req.params.notificacionId);
  res.status(204).end();
}
