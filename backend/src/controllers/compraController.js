import * as compraService from '../services/compraService.js';
import { ORDEN_ESTADOS } from '../domain/compra.js';
import { ValidationError } from '../http/errors.js';
import { parsePagina } from '../http/pagination.js';
import { requireId, requireInteger, requireString } from '../http/validation.js';

// Pago, utilización y cancelación responden igual: la compra con el estado nuevo.
function changeEstado(accion) {
  return async (req, res) => {
    res.status(200).json(accion(requireId(req.params.id), req.usuario));
  };
}

// Caso de uso 1: las compras del usuario activo como comprador, de a páginas.
// ?estado= filtra (vacío cuenta como ausente); cantidades cuenta todas.
export async function list(req, res) {
  const estado = req.query.estado === '' ? undefined : req.query.estado;
  if (estado !== undefined && !ORDEN_ESTADOS.includes(estado)) {
    throw new ValidationError(`El campo estado tiene que ser uno de: ${ORDEN_ESTADOS.join(', ')}`);
  }
  const pagina = parsePagina(req.query);
  res.status(200).json(compraService.comprasDe(req.usuario, estado, pagina));
}

export async function getById(req, res) {
  res.status(200).json(compraService.verCompra(requireId(req.params.id), req.usuario));
}

export async function create(req, res) {
  const body = req.body ?? {};
  const datos = {
    eventoId: requireId(body.eventoId, 'eventoId'),
    tipoEntradaId: requireId(body.tipoEntradaId, 'tipoEntradaId'),
    cantidad: requireInteger(body.cantidad, 'cantidad', { min: 1 }),
  };

  const compra = compraService.comprar(datos, req.usuario);
  res.status(201).location(`/compras/${compra.id}`).json(compra);
}

export const pay = changeEstado(compraService.pagar);
export const markUtilizada = changeEstado(compraService.marcarUtilizada);
// PENDIENTE → CANCELADA, CONFIRMADA → REEMBOLSADA (casos de uso 7 y 8).
export const cancel = changeEstado(compraService.cancelar);

// Chat de la compra (casos de uso 5 y 6), del mensaje más viejo al más nuevo.
export async function listMensajes(req, res) {
  res.status(200).json(compraService.mensajesDe(requireId(req.params.id), req.usuario));
}

export async function createMensaje(req, res) {
  const id = requireId(req.params.id);
  const texto = requireString(req.body?.mensaje, 'mensaje', { maxLength: 500 });
  res.status(201).json(compraService.enviarMensaje(id, req.usuario, texto));
}

// Al abrir el chat (o mientras está abierto) queda leído hasta ahora para quien lo pide.
export async function markMensajesRead(req, res) {
  compraService.leerMensajes(requireId(req.params.id), req.usuario);
  res.status(204).end();
}
