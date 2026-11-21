import * as eventoService from '../services/eventoService.js';
import * as compraService from '../services/compraService.js';
import { ORDENES, FILTROS_ORGANIZADOR } from '../domain/evento.js';
import { ORDEN_ESTADOS } from '../domain/compra.js';
import { ValidationError } from '../http/errors.js';
import { parsePagina } from '../http/pagination.js';
import {
  requireArray, requireDate, requireId, requireInteger, requireNumber, requireString, requireUrl,
} from '../http/validation.js';

// Largo máximo de los textos del evento. Son los mismos que LARGOS en mobile/src/app/eventos/nuevo.js:
// si se cambian, cambiarlos en los dos lados.
const LARGOS = { nombre: 80, descripcion: 1000, lugar: 150, tipoNombre: 40, tipoDescripcion: 120 };

function parseTipoEntrada(tipo, i) {
  const campo = (nombre) => `tiposEntrada[${i}].${nombre}`;
  return {
    nombre: requireString(tipo?.nombre, campo('nombre'), { maxLength: LARGOS.tipoNombre }),
    descripcion: requireString(tipo?.descripcion, campo('descripcion'), { maxLength: LARGOS.tipoDescripcion }),
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
  const pagina = parsePagina(req.query);

  res.status(200).json(eventoService.buscarEnCatalogo(filtros, pagina));
}

export async function create(req, res) {
  const body = req.body ?? {};
  const multimedia = body.multimedia === undefined
    ? []
    : requireArray(body.multimedia, 'multimedia').map((url, i) => requireUrl(url, `multimedia[${i}]`));

  const datos = {
    nombre: requireString(body.nombre, 'nombre', { maxLength: LARGOS.nombre }),
    descripcion: requireString(body.descripcion, 'descripcion', { maxLength: LARGOS.descripcion }),
    lugar: requireString(body.lugar, 'lugar', { maxLength: LARGOS.lugar }),
    categoriaId: requireId(body.categoriaId, 'categoriaId'),
    fecha: requireDate(body.fecha, 'fecha'),
    multimedia,
    tiposEntrada: requireArray(body.tiposEntrada, 'tiposEntrada', { minLength: 1 }).map(parseTipoEntrada),
  };

  const evento = eventoService.crearEvento(datos, req.usuario);
  res.status(201).location(`/eventos/${evento.id}`).json(evento);
}

export async function getById(req, res) {
  const id = requireId(req.params.id);
  res.status(200).json(eventoService.verEvento(id));
}

// GET /usuarios/:id/eventos: los eventos que organiza, incluidos los pasados. Son públicos.
// El filtro es opcional; el armado de la página está en eventoService.eventosDe.
export async function listByOrganizador(req, res) {
  const id = requireId(req.params.id);
  const filtro = optional(req.query.filtro, (v) => {
    if (!FILTROS_ORGANIZADOR.includes(v)) {
      throw new ValidationError(`El campo filtro tiene que ser uno de: ${FILTROS_ORGANIZADOR.join(', ')}`);
    }
    return v;
  });
  const pagina = parsePagina(req.query);

  res.status(200).json(eventoService.eventosDe(id, filtro, pagina));
}

// Caso de uso 2, de a páginas. Las disponibles por tipo salen de GET /eventos/:id.
// Con ?conMensajes=true es la bandeja de mensajes (ver compraService.ventasDe).
export async function listCompras(req, res) {
  const id = requireId(req.params.id);
  const conMensajes = optional(req.query.conMensajes, (v) => {
    if (v !== 'true' && v !== 'false') throw new ValidationError('El campo conMensajes tiene que ser true o false');
    return v === 'true';
  });
  const estado = optional(req.query.estado, (v) => {
    if (!ORDEN_ESTADOS.includes(v)) throw new ValidationError(`El campo estado tiene que ser uno de: ${ORDEN_ESTADOS.join(', ')}`);
    return v;
  });
  const pagina = parsePagina(req.query);

  res.status(200).json(compraService.ventasDe(id, req.usuario, { conMensajes, estado }, pagina));
}
