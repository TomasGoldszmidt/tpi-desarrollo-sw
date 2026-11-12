import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import {
  comprar, detalleCompra, actualizarEstado, estadoAlCancelar, puedeVer, enviarMensaje, mensajesConAutor,
  leerMensajes, ordenarPorImportancia, cantidadesPorEstado, ORDEN_ESTADOS,
} from '../domain/compra.js';
import { EstadoCompra } from '../domain/estadoCompra.js';
import { reseniaDeCompra } from '../domain/resenia.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../http/errors.js';
import { paginar, parsePagina } from '../http/pagination.js';
import { requireId, requireInteger, requireString } from '../http/validation.js';

// lector: quien pide, para contar los mensajes que todavía no leyó.
function toDetalle(compra, lector) {
  return {
    ...detalleCompra(
      compra,
      eventoRepository.findById(compra.eventoId),
      usuarioRepository.findById(compra.compradorId),
      lector,
    ),
    resenia: reseniaDeCompra(compra),
  };
}

function findCompra(req) {
  const id = requireId(req.params.id);
  const compra = compraRepository.findById(id);
  if (!compra) throw new NotFoundError(`No existe la compra ${id}`);
  return compra;
}

// Pago, utilización y cancelación son el mismo cambio de estado con otro destino; las reglas
// están en el dominio. `destino` recibe la compra porque al cancelar depende de su estado.
function changeEstado(destino) {
  return async (req, res) => {
    const compra = findCompra(req);
    const evento = eventoRepository.findById(compra.eventoId);
    const actualizada = actualizarEstado(compra, evento, destino(compra), req.usuario);
    res.status(200).json(toDetalle(actualizada, req.usuario));
  };
}

// Caso de uso 1: las compras del usuario activo como comprador, de la más importante a la
// menos (ver ordenarPorImportancia), de a páginas. ?estado= filtra; cantidades cuenta todas.
export async function list(req, res) {
  const { estado } = req.query;
  if (estado !== undefined && estado !== '' && !ORDEN_ESTADOS.includes(estado)) {
    throw new ValidationError(`El campo estado tiene que ser uno de: ${ORDEN_ESTADOS.join(', ')}`);
  }
  const pagina = parsePagina(req.query);

  const compras = ordenarPorImportancia(
    compraRepository.findByComprador(req.usuario.id).map((compra) => toDetalle(compra, req.usuario)),
  );
  const filtradas = estado ? compras.filter((compra) => compra.estado === estado) : compras;
  res.status(200).json(paginar(filtradas, pagina, { cantidades: cantidadesPorEstado(compras) }));
}

export async function getById(req, res) {
  const compra = findCompra(req);
  const evento = eventoRepository.findById(compra.eventoId);
  if (!puedeVer(compra, evento, req.usuario)) throw new ForbiddenError('No podés ver esta compra');
  res.status(200).json(toDetalle(compra, req.usuario));
}

export async function create(req, res) {
  const body = req.body ?? {};
  const datos = {
    eventoId: requireId(body.eventoId, 'eventoId'),
    tipoEntradaId: requireId(body.tipoEntradaId, 'tipoEntradaId'),
    cantidad: requireInteger(body.cantidad, 'cantidad', { min: 1 }),
  };

  const compra = comprar(datos, req.usuario);
  res.status(201).location(`/compras/${compra.id}`).json(toDetalle(compra, req.usuario));
}

export const pay = changeEstado(() => EstadoCompra.CONFIRMADA);
export const markUtilizada = changeEstado(() => EstadoCompra.UTILIZADA);
// PENDIENTE → CANCELADA, CONFIRMADA → REEMBOLSADA (casos de uso 7 y 8).
export const cancel = changeEstado(estadoAlCancelar);

// Chat de la compra (casos de uso 5 y 6), del mensaje más viejo al más nuevo.
export async function listMensajes(req, res) {
  const compra = findCompra(req);
  const evento = eventoRepository.findById(compra.eventoId);
  if (!puedeVer(compra, evento, req.usuario)) {
    throw new ForbiddenError('Solo el comprador y el organizador pueden ver este chat');
  }
  res.status(200).json(mensajesConAutor(compra.mensajes));
}

export async function createMensaje(req, res) {
  const compra = findCompra(req);
  const texto = requireString(req.body?.mensaje, 'mensaje', { maxLength: 500 });
  const evento = eventoRepository.findById(compra.eventoId);
  res.status(201).json(enviarMensaje(compra, evento, req.usuario, texto));
}

// Al abrir el chat (o mientras está abierto) queda leído hasta ahora para quien lo pide.
export async function markMensajesRead(req, res) {
  const compra = findCompra(req);
  leerMensajes(compra, eventoRepository.findById(compra.eventoId), req.usuario);
  res.status(204).end();
}
