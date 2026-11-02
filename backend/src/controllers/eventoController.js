import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { crearEvento, detalleEvento } from '../domain/evento.js';
import { NotFoundError } from '../http/errors.js';
import {
  requireArray, requireDate, requireId, requireInteger, requireNumber, requireString,
} from '../http/validation.js';

function toDetalle(evento) {
  return detalleEvento(
    evento,
    compraRepository.findByEvento(evento.id),
    categoriaRepository.findById(evento.categoriaId),
    usuarioRepository.findById(evento.organizadorId),
  );
}

function parseTipoEntrada(tipo, i) {
  const campo = (nombre) => `tiposEntrada[${i}].${nombre}`;
  return {
    nombre: requireString(tipo?.nombre, campo('nombre')),
    descripcion: requireString(tipo?.descripcion, campo('descripcion')),
    precio: requireNumber(tipo?.precio, campo('precio'), { min: 0 }),
    cupo: requireInteger(tipo?.cupo, campo('cupo'), { min: 1 }),
  };
}

export async function create(req, res) {
  const body = req.body ?? {};
  const multimedia = body.multimedia === undefined
    ? []
    : requireArray(body.multimedia, 'multimedia').map((url, i) => requireString(url, `multimedia[${i}]`));

  const datos = {
    nombre: requireString(body.nombre, 'nombre'),
    descripcion: requireString(body.descripcion, 'descripcion'),
    lugar: requireString(body.lugar, 'lugar'),
    categoriaId: requireId(body.categoriaId, 'categoriaId'),
    fecha: requireDate(body.fecha, 'fecha'),
    multimedia,
    tiposEntrada: requireArray(body.tiposEntrada, 'tiposEntrada', { minLength: 1 }).map(parseTipoEntrada),
  };

  const evento = crearEvento(datos, req.usuario);
  res.status(201).json(toDetalle(evento));
}

export async function getById(req, res) {
  const id = requireId(req.params.id);
  const evento = eventoRepository.findById(id);
  if (!evento) throw new NotFoundError(`No existe el evento ${id}`);
  res.status(200).json(toDetalle(evento));
}
