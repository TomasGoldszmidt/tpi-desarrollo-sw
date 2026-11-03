import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { crearEvento, detalleEvento, buscarEventos, ORDENES, eventosOrganizados, verificarOrganizador } from '../domain/evento.js';
import { detalleCompra, masRecientesPrimero } from '../domain/compra.js';
import { puntajeDe, reseniaDeCompra } from '../domain/resenia.js';
import { NotFoundError, ValidationError } from '../http/errors.js';
import {
  requireArray, requireDate, requireId, requireInteger, requireNumber, requireString, requireUrl,
} from '../http/validation.js';

function toDetalle(evento) {
  const organizador = usuarioRepository.findById(evento.organizadorId);
  return detalleEvento(
    evento,
    compraRepository.findByEvento(evento.id),
    categoriaRepository.findById(evento.categoriaId),
    organizador,
    puntajeDe(organizador),
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

// Los filtros son opcionales: un parámetro vacío (`?texto=`) cuenta como ausente.
function optional(value, parse) {
  return value === undefined || value === '' ? undefined : parse(value);
}

export async function list(req, res) {
  const { texto, categoriaId, precioMin, precioMax, orden } = req.query;
  const filtros = {
    texto: optional(texto, (v) => {
      // `?texto=a&texto=b` llega como array.
      if (typeof v !== 'string') throw new ValidationError('El campo texto tiene que ser un solo texto');
      return v.trim() || undefined;
    }),
    categoriaId: optional(categoriaId, (v) => requireId(v, 'categoriaId')),
    precioMin: optional(precioMin, (v) => requireNumber(v, 'precioMin', { min: 0 })),
    precioMax: optional(precioMax, (v) => requireNumber(v, 'precioMax', { min: 0 })),
    orden: optional(orden, (v) => {
      if (!ORDENES.includes(v)) throw new ValidationError(`El campo orden tiene que ser uno de: ${ORDENES.join(', ')}`);
      return v;
    }),
  };
  if (filtros.precioMin !== undefined && filtros.precioMax !== undefined && filtros.precioMin > filtros.precioMax) {
    throw new ValidationError('El campo precioMin no puede ser mayor que precioMax');
  }

  res.status(200).json(buscarEventos(filtros));
}

export async function create(req, res) {
  const body = req.body ?? {};
  const multimedia = body.multimedia === undefined
    ? []
    : requireArray(body.multimedia, 'multimedia').map((url, i) => requireUrl(url, `multimedia[${i}]`));

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
  res.status(201).location(`/eventos/${evento.id}`).json(toDetalle(evento));
}

export async function getById(req, res) {
  const id = requireId(req.params.id);
  const evento = eventoRepository.findById(id);
  if (!evento) throw new NotFoundError(`No existe el evento ${id}`);
  res.status(200).json(toDetalle(evento));
}

// GET /usuarios/:id/eventos: los eventos que organiza, incluidos los pasados. Son públicos.
export async function listByOrganizador(req, res) {
  const id = requireId(req.params.id);
  const organizador = usuarioRepository.findById(id);
  if (!organizador) throw new NotFoundError(`No existe el usuario ${id}`);
  res.status(200).json(eventosOrganizados(organizador));
}

// Caso de uso 2. Las disponibles por tipo salen de GET /eventos/:id.
export async function listCompras(req, res) {
  const id = requireId(req.params.id);
  const evento = eventoRepository.findById(id);
  if (!evento) throw new NotFoundError(`No existe el evento ${id}`);
  verificarOrganizador(evento, req.usuario);

  const compras = masRecientesPrimero(compraRepository.findByEvento(evento.id));
  res.status(200).json(compras.map((compra) => ({
    ...detalleCompra(compra, evento, usuarioRepository.findById(compra.compradorId)),
    resenia: reseniaDeCompra(compra),
  })));
}
