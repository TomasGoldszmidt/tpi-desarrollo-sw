import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { crearResenia, reseniasDeOrganizador } from '../domain/resenia.js';
import { NotFoundError } from '../http/errors.js';
import { paginar, parsePagina } from '../http/pagination.js';
import { requireId, requireInteger, requireString } from '../http/validation.js';

export async function create(req, res) {
  const body = req.body ?? {};
  const datos = {
    eventoId: requireId(body.eventoId, 'eventoId'),
    puntuacion: requireInteger(body.puntuacion, 'puntuacion', { min: 1, max: 5 }),
    detalle: requireString(body.detalle, 'detalle', { maxLength: 500 }),
  };
  res.status(201).json(crearResenia(datos, req.usuario));
}

// GET /usuarios/:id/resenias: las reseñas recibidas como organizador, de a páginas.
export async function listByOrganizador(req, res) {
  const id = requireId(req.params.id);
  const usuario = usuarioRepository.findById(id);
  if (!usuario) throw new NotFoundError(`No existe el usuario ${id}`);
  const pagina = parsePagina(req.query);
  res.status(200).json(paginar(reseniasDeOrganizador(usuario), pagina));
}
