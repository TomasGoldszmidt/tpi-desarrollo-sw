import * as notificacionService from '../services/notificacionService.js';
import { requireId } from '../http/validation.js';
import { parsePagina } from '../http/pagination.js';

export async function list(req, res) {
  const id = requireId(req.params.id);
  const pagina = parsePagina(req.query);
  res.status(200).json(notificacionService.listarNotificaciones(req.usuario, id, pagina));
}

export async function markRead(req, res) {
  notificacionService.marcarLeidas(req.usuario, requireId(req.params.id));
  res.status(204).end();
}

export async function markOneRead(req, res) {
  notificacionService.marcarLeida(req.usuario, requireId(req.params.id), req.params.notificacionId);
  res.status(204).end();
}
