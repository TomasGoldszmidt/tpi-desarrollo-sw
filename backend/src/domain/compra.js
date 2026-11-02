import { EstadoCompra } from './estadoCompra.js';
import { yaSeRealizo, esElDiaOPosterior } from './evento.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import { BusinessRuleError, ForbiddenError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Compra} Compra */
/** @typedef {import('../persistence/schemas.js').Evento} Evento */
/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

// Las compras que reservan lugar. Una PENDIENTE también ocupa: si no, dos personas
// podrían comprar la última entrada y la segunda se enteraría recién al pagar.
// CANCELADA y REEMBOLSADA liberan el lugar.
export const ESTADOS_QUE_OCUPAN_CUPO = Object.freeze([PENDIENTE, CONFIRMADA, UTILIZADA]);

export function ocupaCupo(compra) {
  return ESTADOS_QUE_OCUPAN_CUPO.includes(compra.estado);
}

const esComprador = (usuario, compra) => usuario.id === compra.compradorId;
const esOrganizador = (usuario, compra, evento) => usuario.id === evento.organizadorId;

const noSeRealizo = {
  cumple: (evento, ahora) => !yaSeRealizo(evento, ahora),
  mensaje: 'El evento ya se realizó',
};
const llegoElDia = {
  cumple: esElDiaOPosterior,
  mensaje: 'Todavía no es el día del evento',
};

// Únicos cambios de estado válidos; cualquier otro se rechaza.
// UTILIZADA, CANCELADA y REEMBOLSADA son finales: no salen a ningún lado.
// La regla de cancelación del enunciado (no UTILIZADA y evento no realizado) queda acá.
const TRANSICIONES = [
  { desde: PENDIENTE, hacia: CONFIRMADA, quien: esComprador, condicion: noSeRealizo },
  { desde: PENDIENTE, hacia: CANCELADA, quien: esComprador, condicion: noSeRealizo },
  { desde: CONFIRMADA, hacia: REEMBOLSADA, quien: esComprador, condicion: noSeRealizo },
  { desde: CONFIRMADA, hacia: UTILIZADA, quien: esOrganizador, condicion: llegoElDia },
];

// Cancelar no es un estado: si no estaba pagada queda CANCELADA, y si estaba pagada, REEMBOLSADA.
/** @param {Compra} compra @returns {'CANCELADA' | 'REEMBOLSADA'} */
export function estadoAlCancelar(compra) {
  if (compra.estado === PENDIENTE) return CANCELADA;
  if (compra.estado === CONFIRMADA) return REEMBOLSADA;
  throw new BusinessRuleError(`No se puede cancelar una compra ${compra.estado}`);
}

// `Compra.actualizarEstado(EstadoCompra)` del diagrama. Valida la transición, quién la pide
// y la fecha del evento; si todo está bien, graba el estado y el historial juntos.
/**
 * @param {Compra} compra @param {Evento} evento El evento de la compra.
 * @param {string} nuevoEstado @param {Usuario} usuario Quien hace el cambio.
 * @param {Date} [ahora]
 * @returns {Compra}
 */
export function actualizarEstado(compra, evento, nuevoEstado, usuario, ahora = new Date()) {
  const transicion = TRANSICIONES.find((t) => t.desde === compra.estado && t.hacia === nuevoEstado);
  if (!transicion) {
    throw new BusinessRuleError(`No se puede pasar de ${compra.estado} a ${nuevoEstado}`);
  }
  if (!transicion.quien(usuario, compra, evento)) {
    throw new ForbiddenError(`No podés pasar esta compra a ${nuevoEstado}`);
  }
  if (!transicion.condicion.cumple(evento, ahora)) {
    throw new BusinessRuleError(transicion.condicion.mensaje);
  }

  return compraRepository.addCambioEstado(compra.id, { estado: nuevoEstado, usuarioId: usuario.id, fechaHora: ahora });
}
