import { Collection } from '../collection.js';
import { EstadoCompra } from '../../domain/estadoCompra.js';

/** @typedef {import('../schemas.js').Compra} Compra */

const compras = new Collection();

// Arranca en PENDIENTE. Que haya cupo lo valida el dominio antes de llamar.
/** @returns {Compra} */
export function create({ compradorId, eventoId, tipoEntradaId, cantidad, total, fechaHora = new Date() }) {
  return compras.insert({
    compradorId: Number(compradorId),
    eventoId: Number(eventoId),
    tipoEntradaId: Number(tipoEntradaId),
    cantidad,
    total,
    estado: EstadoCompra.PENDIENTE,
    historial: [{ estado: EstadoCompra.PENDIENTE, usuarioId: Number(compradorId), fechaHora: new Date(fechaHora) }],
    mensajes: [],
  });
}

/** @returns {Compra | null} */
export function findById(id) {
  return compras.findById(id);
}

/** @returns {Compra[]} */
export function findByComprador(compradorId) {
  return compras.findAll((compra) => compra.compradorId === Number(compradorId));
}

/** @returns {Compra[]} */
export function findByEvento(eventoId) {
  return compras.findAll((compra) => compra.eventoId === Number(eventoId));
}

// Escribe el estado y el historial juntos para que no se desincronicen.
// Si la transición es válida lo decide el dominio.
/** @returns {Compra | null} */
export function addCambioEstado(id, { estado, usuarioId, fechaHora = new Date() }) {
  const compra = compras.findById(id);
  if (!compra) return null;

  return compras.update(id, {
    estado,
    historial: [...compra.historial, { estado, usuarioId: Number(usuarioId), fechaHora: new Date(fechaHora) }],
  });
}

/** @returns {Compra | null} */
export function addMensaje(id, { usuarioId, mensaje, enviado = new Date() }) {
  const compra = compras.findById(id);
  if (!compra) return null;

  return compras.update(id, {
    mensajes: [...compra.mensajes, { usuarioId: Number(usuarioId), mensaje, enviado: new Date(enviado) }],
  });
}
