import { Coleccion } from '../coleccion.js';
import { EstadoCompra } from '../../dominio/estadoCompra.js';

/** @typedef {import('../esquemas.js').Compra} Compra */

const compras = new Coleccion();

// Arranca en PENDIENTE. Que haya cupo lo valida el dominio antes de llamar.
/** @returns {Compra} */
export function crear({ compradorId, eventoId, tipoEntradaId, cantidad, total, fechaHora = new Date() }) {
  return compras.insertar({
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
export function buscarPorId(id) {
  return compras.buscarPorId(id);
}

/** @returns {Compra[]} */
export function buscarPorComprador(compradorId) {
  return compras.buscarTodos((compra) => compra.compradorId === Number(compradorId));
}

/** @returns {Compra[]} */
export function buscarPorEvento(eventoId) {
  return compras.buscarTodos((compra) => compra.eventoId === Number(eventoId));
}

// Escribe el estado y el historial juntos para que no se desincronicen.
// Si la transición es válida lo decide el dominio.
/** @returns {Compra | null} */
export function registrarCambioEstado(id, { estado, usuarioId, fechaHora = new Date() }) {
  const compra = compras.buscarPorId(id);
  if (!compra) return null;

  return compras.actualizar(id, {
    estado,
    historial: [...compra.historial, { estado, usuarioId: Number(usuarioId), fechaHora: new Date(fechaHora) }],
  });
}

/** @returns {Compra | null} */
export function agregarMensaje(id, { usuarioId, mensaje, enviado = new Date() }) {
  const compra = compras.buscarPorId(id);
  if (!compra) return null;

  return compras.actualizar(id, {
    mensajes: [...compra.mensajes, { usuarioId: Number(usuarioId), mensaje, enviado: new Date(enviado) }],
  });
}
