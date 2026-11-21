import * as reseniaService from '../services/reseniaService.js';
import { parsePagina } from '../http/pagination.js';
import { requireId, requireInteger, requireString } from '../http/validation.js';

// POST /resenias: el usuario activo reseña un evento al que asistió (caso de uso 9).
export async function create(req, res) {
  const body = req.body ?? {};
  const datos = {
    eventoId: requireId(body.eventoId, 'eventoId'),
    puntuacion: requireInteger(body.puntuacion, 'puntuacion', { min: 1, max: 5 }),
    detalle: requireString(body.detalle, 'detalle', { maxLength: 500 }),
  };
  res.status(201).json(reseniaService.crearResenia(datos, req.usuario));
}

// GET /usuarios/:id/resenias: las reseñas recibidas como organizador, de a páginas.
export async function listByOrganizador(req, res) {
  const id = requireId(req.params.id);
  const pagina = parsePagina(req.query);
  res.status(200).json(reseniaService.listarReseniasDe(id, pagina));
}
