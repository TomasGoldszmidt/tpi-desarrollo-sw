import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { crearEvento, detalleEvento, buscarEventos, ORDENES, eventosOrganizados, verificarOrganizador,
  FILTROS_ORGANIZADOR, filtroOrganizador, cantidadesOrganizador } from '../domain/evento.js';
import { cantidadConMensajesNoLeidos, detalleCompra, masRecientesPrimero } from '../domain/compra.js';
import { puntajeDe, reseniaDeCompra } from '../domain/resenia.js';
import { NotFoundError, ValidationError } from '../http/errors.js';
import { paginar, parsePagina } from '../http/pagination.js';
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

  const pagina = parsePagina(req.query);

  res.status(200).json(paginar(buscarEventos(filtros), pagina));
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
// Cada uno trae cuántas compras tienen mensajes que el organizador no leyó. Van de a
// páginas, con un filtro opcional y cuántos hay con cada filtro (los chips de la app).
export async function listByOrganizador(req, res) {
  const id = requireId(req.params.id);
  const organizador = usuarioRepository.findById(id);
  if (!organizador) throw new NotFoundError(`No existe el usuario ${id}`);
  const filtro = optional(req.query.filtro, (v) => {
    if (!FILTROS_ORGANIZADOR.includes(v)) {
      throw new ValidationError(`El campo filtro tiene que ser uno de: ${FILTROS_ORGANIZADOR.join(', ')}`);
    }
    return v;
  });
  const pagina = parsePagina(req.query);

  const ahora = new Date();
  const eventos = eventosOrganizados(organizador, ahora).map((evento) => ({
    ...evento,
    conMensajesNoLeidos: cantidadConMensajesNoLeidos(
      compraRepository.findByEvento(evento.id), eventoRepository.findById(evento.id), organizador,
    ),
  }));
  const filtrados = eventos.filter((evento) => filtroOrganizador(evento, filtro, ahora));
  res.status(200).json(paginar(filtrados, pagina, { cantidades: cantidadesOrganizador(eventos, ahora) }));
}

// Caso de uso 2, de a páginas. Las disponibles por tipo salen de GET /eventos/:id.
export async function listCompras(req, res) {
  const id = requireId(req.params.id);
  const evento = eventoRepository.findById(id);
  if (!evento) throw new NotFoundError(`No existe el evento ${id}`);
  verificarOrganizador(evento, req.usuario);
  const pagina = parsePagina(req.query);

  // Se arma el detalle solo de las compras de la página pedida.
  const { resultados, ...datosPagina } = paginar(masRecientesPrimero(compraRepository.findByEvento(evento.id)), pagina);
  res.status(200).json({
    resultados: resultados.map((compra) => ({
      ...detalleCompra(compra, evento, usuarioRepository.findById(compra.compradorId), req.usuario),
      resenia: reseniaDeCompra(compra),
    })),
    ...datosPagina,
  });
}
