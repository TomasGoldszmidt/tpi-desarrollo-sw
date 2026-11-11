import { EstadoCompra } from './estadoCompra.js';
import { yaSeRealizo, esElDiaOPosterior } from './evento.js';
import { calcularDisponibles, hayCupoPara } from './tipoEntrada.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { BusinessRuleError, ForbiddenError, ValidationError } from '../http/errors.js';

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

// Caso de uso 12. La compra arranca PENDIENTE y ya ocupa cupo. El total lo calcula el
// dominio con el precio actual: es lo que se paga y lo que se reembolsa.
/**
 * @param {{ eventoId: number, tipoEntradaId: number, cantidad: number }} datos Forma ya validada.
 * @param {Usuario} comprador @param {Date} [ahora]
 * @returns {Compra}
 */
export function comprar({ eventoId, tipoEntradaId, cantidad }, comprador, ahora = new Date()) {
  const evento = eventoRepository.findById(eventoId);
  if (!evento) throw new ValidationError(`No existe el evento ${eventoId}`);

  const tipoEntrada = evento.tiposEntrada.find((tipo) => tipo.id === tipoEntradaId);
  if (!tipoEntrada) throw new ValidationError(`El evento no tiene el tipo de entrada ${tipoEntradaId}`);

  // Si el organizador comprara en su evento, se mezclarían los roles en el chat y en las ventas.
  if (evento.organizadorId === comprador.id) {
    throw new BusinessRuleError('No podés comprar entradas de un evento que organizás');
  }
  if (yaSeRealizo(evento, ahora)) throw new BusinessRuleError('El evento ya se realizó');

  const compras = compraRepository.findByEvento(evento.id);
  if (!hayCupoPara(tipoEntrada, compras, cantidad)) {
    const disponibles = calcularDisponibles(tipoEntrada, compras);
    throw new BusinessRuleError(`No hay cupo suficiente: quedan ${disponibles} entradas`);
  }

  return compraRepository.create({
    compradorId: comprador.id,
    eventoId: evento.id,
    tipoEntradaId,
    cantidad,
    total: tipoEntrada.precio * cantidad,
    fechaHora: ahora,
  });
}

const UN_DIA = 24 * 60 * 60 * 1000;

function inicioDelDia(fecha) {
  const dia = new Date(fecha);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

// Caso de uso 1: días que faltan para el evento, solo si la compra está CONFIRMADA.
// Son días de calendario: hoy es 0 y mañana es 1 aunque falten pocas horas.
// Si el evento ya se realizó no falta nada: null.
/** @param {Compra} compra @param {Evento} evento @param {Date} [ahora] @returns {number | null} */
export function diasRestantes(compra, evento, ahora = new Date()) {
  if (compra.estado !== CONFIRMADA || yaSeRealizo(evento, ahora)) return null;
  return Math.round((inicioDelDia(evento.fecha) - inicioDelDia(ahora)) / UN_DIA);
}

// Orden de los listados de compras (las del comprador y las ventas del organizador).
/** @param {Compra[]} compras @returns {Compra[]} */
export function masRecientesPrimero(compras) {
  const fechaDeCompra = (compra) => compra.historial[0].fechaHora;
  return [...compras].sort((a, b) => fechaDeCompra(b) - fechaDeCompra(a));
}

// La compra la ven el comprador y el organizador del evento, que también usa su chat.
/** @param {Compra} compra @param {Evento} evento @param {Usuario} usuario @returns {boolean} */
export function puedeVer(compra, evento, usuario) {
  return esComprador(usuario, compra) || esOrganizador(usuario, compra, evento);
}

// Forma de la compra para la app: resúmenes del evento, el tipo de entrada y el comprador
// en lugar de sus ids, y los días que faltan (calculados). El historial y el chat van tal cual.
// Con `lector` (quien pide), suma cuántos mensajes del chat todavía no leyó.
/**
 * @param {Compra} compra @param {Evento} evento @param {Usuario} comprador
 * @param {Usuario | null} [lector] @param {Date} [ahora]
 */
export function detalleCompra(compra, evento, comprador, lector = null, ahora = new Date()) {
  const { compradorId: _compradorId, eventoId: _eventoId, tipoEntradaId, mensajesLeidosHasta: _leidos, ...resto } = compra;
  const tipoEntrada = evento.tiposEntrada.find((tipo) => tipo.id === tipoEntradaId);
  return {
    id: compra.id,
    evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha, lugar: evento.lugar, organizadorId: evento.organizadorId },
    tipoEntrada: { id: tipoEntrada.id, nombre: tipoEntrada.nombre, precio: tipoEntrada.precio },
    comprador: { id: comprador.id, nombre: comprador.nombre, apellido: comprador.apellido },
    ...resto,
    diasRestantes: diasRestantes(compra, evento, ahora),
    ...(lector ? { mensajesNoLeidos: mensajesNoLeidos(compra, evento, lector) } : {}),
  };
}

// Cada mensaje con los datos de quien lo escribió, para que el chat muestre nombres:
// la compra trae al comprador, pero no al organizador.
/** @param {import('../persistence/schemas.js').Mensaje[]} mensajes */
export function mensajesConAutor(mensajes) {
  return mensajes.map(({ usuarioId, mensaje, enviado }) => {
    const autor = usuarioRepository.findById(usuarioId);
    return { autor: { id: autor.id, nombre: autor.nombre, apellido: autor.apellido }, mensaje, enviado };
  });
}

// Qué papel tiene el usuario en el chat de la compra; null si no participa.
// No hay ambigüedad: el organizador no puede comprar en su propio evento.
/** @param {Compra} compra @param {Evento} evento @param {Usuario} usuario @returns {'comprador' | 'organizador' | null} */
export function rolEnCompra(compra, evento, usuario) {
  if (esComprador(usuario, compra)) return 'comprador';
  if (esOrganizador(usuario, compra, evento)) return 'organizador';
  return null;
}

// Mensajes que escribió el otro después de la última vez que el usuario abrió el chat.
// Los propios nunca cuentan. Si nunca lo abrió, cuentan todos los del otro.
/** @param {Compra} compra @param {Evento} evento @param {Usuario} usuario @returns {number} */
export function mensajesNoLeidos(compra, evento, usuario) {
  const rol = rolEnCompra(compra, evento, usuario);
  if (!rol) return 0;
  const leidoHasta = compra.mensajesLeidosHasta[rol];
  return compra.mensajes
    .filter((mensaje) => mensaje.usuarioId !== usuario.id && (leidoHasta === null || mensaje.enviado > leidoHasta))
    .length;
}

// Para Mis eventos: cuántas compras de un evento tienen mensajes que el organizador no leyó.
/** @param {Compra[]} compras @param {Evento} evento @param {Usuario} usuario @returns {number} */
export function cantidadConMensajesNoLeidos(compras, evento, usuario) {
  return compras.filter((compra) => mensajesNoLeidos(compra, evento, usuario) > 0).length;
}

// Al abrir el chat: todo lo que hay hasta ahora queda leído para quien lo abrió.
/** @param {Compra} compra @param {Evento} evento @param {Usuario} usuario @param {Date} [ahora] @returns {Compra} */
export function leerMensajes(compra, evento, usuario, ahora = new Date()) {
  const rol = rolEnCompra(compra, evento, usuario);
  if (!rol) throw new ForbiddenError('Solo el comprador y el organizador pueden leer este chat');
  return compraRepository.marcarMensajesLeidos(compra.id, rol, ahora);
}

// Casos de uso 5 y 6: comprador y organizador escriben "en cualquier momento",
// así que no importa el estado de la compra ni si el evento ya pasó.
/**
 * @param {Compra} compra @param {Evento} evento @param {Usuario} usuario
 * @param {string} texto Ya validado por el controlador. @param {Date} [ahora]
 */
export function enviarMensaje(compra, evento, usuario, texto, ahora = new Date()) {
  if (!puedeVer(compra, evento, usuario)) {
    throw new ForbiddenError('Solo el comprador y el organizador pueden escribir en este chat');
  }
  const actualizada = compraRepository.addMensaje(compra.id, { usuarioId: usuario.id, mensaje: texto, enviado: ahora });
  // Quien escribe ya vio el chat hasta acá.
  compraRepository.marcarMensajesLeidos(compra.id, rolEnCompra(compra, evento, usuario), ahora);
  return mensajesConAutor([actualizada.mensajes.at(-1)])[0];
}
