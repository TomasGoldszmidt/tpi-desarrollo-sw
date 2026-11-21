import { EstadoCompra } from './estadoCompra.js';
import { BusinessRuleError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Evento} Evento */
/** @typedef {import('../persistence/schemas.js').Resenia} Resenia */
/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Compra} Compra */
/** @typedef {Map<number, { puntaje: number, cantidadResenias: number }>} Puntajes */

// Puntaje de cada organizador: promedio de las reseñas de todos sus eventos. No se guarda.
// La reseña no lleva el organizador, así que se llega a él por el evento reseñado.
// Un organizador sin reseñas no aparece en el Map: su puntaje es null.
/**
 * @param {Evento[]} eventos Todos los eventos (para saber de quién es cada uno).
 * @param {Resenia[]} resenias
 * @returns {Puntajes}
 */
export function calcularPuntajes(eventos, resenias) {
  const organizadorDe = new Map(eventos.map((evento) => [evento.id, evento.organizadorId]));
  const sumas = new Map();
  for (const resenia of resenias) {
    const organizadorId = organizadorDe.get(resenia.eventoId);
    const { total = 0, cantidad = 0 } = sumas.get(organizadorId) ?? {};
    sumas.set(organizadorId, { total: total + resenia.puntuacion, cantidad: cantidad + 1 });
  }

  return new Map([...sumas].map(([organizadorId, { total, cantidad }]) =>
    [organizadorId, { puntaje: total / cantidad, cantidadResenias: cantidad }]));
}

// Forma de la reseña para la app: resúmenes del comprador y del evento en lugar de sus ids.
/** @param {Resenia} resenia @param {Evento} evento @param {Usuario} comprador */
export function detalleResenia(resenia, evento, comprador) {
  return {
    id: resenia.id,
    comprador: { id: comprador.id, nombre: comprador.nombre, apellido: comprador.apellido },
    evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
    puntuacion: resenia.puntuacion,
    detalle: resenia.detalle,
  };
}

// La reseña que dejó el comprador de una compra para ese evento, o null. Va en el detalle
// de la compra para que la app muestre la reseña ya hecha o el formulario (caso de uso 9).
/** @param {Resenia | null} resenia */
export function resumenResenia(resenia) {
  return resenia ? { id: resenia.id, puntuacion: resenia.puntuacion, detalle: resenia.detalle } : null;
}

// Caso de uso 9: solo reseña quien usó su entrada, y una vez por evento.
// La forma (puntuación 1 a 5, detalle) llega validada por el controlador.
// Devuelve los datos de la reseña nueva; la guarda el service.
/**
 * @param {{ puntuacion: number, detalle: string }} datos
 * @param {Evento} evento @param {Compra[]} compras Las compras del comprador.
 * @param {Resenia | null} reseniaAnterior La que ya dejó para ese evento, si hay.
 * @param {Usuario} comprador
 */
export function nuevaResenia({ puntuacion, detalle }, evento, compras, reseniaAnterior, comprador) {
  const asistio = compras
    .some((compra) => compra.eventoId === evento.id && compra.estado === EstadoCompra.UTILIZADA);
  if (!asistio) throw new BusinessRuleError('Solo podés reseñar eventos a los que asististe');

  if (reseniaAnterior) throw new BusinessRuleError('Ya reseñaste este evento');

  return { compradorId: comprador.id, eventoId: evento.id, detalle, puntuacion };
}

// Puntaje de un solo organizador, con los mismos valores que muestra el catálogo
// (null y 0 si no tiene reseñas).
/** @param {Usuario} organizador @param {Puntajes} puntajes @returns {{ puntaje: number | null, cantidadResenias: number }} */
export function puntajeDe(organizador, puntajes) {
  const { puntaje = null, cantidadResenias = 0 } = puntajes.get(organizador.id) ?? {};
  return { puntaje, cantidadResenias };
}

// GET /usuarios/:id: el usuario con su puntaje como organizador. Es la cabecera
// de la pantalla de reseñas del organizador (caso de uso 10).
/** @param {Usuario} usuario @param {Puntajes} puntajes */
export function perfilUsuario(usuario, puntajes) {
  return { ...usuario, ...puntajeDe(usuario, puntajes) };
}

// Caso de uso 10: las reseñas de los eventos de un organizador, del evento más reciente
// al más viejo. Un usuario que no organiza nada no tiene reseñas.
/**
 * @param {Resenia[]} resenias Las de sus eventos.
 * @param {Map<number, Evento>} eventos Sus eventos por id.
 * @param {Map<number, Usuario>} usuarios Los usuarios por id (al menos los compradores).
 */
export function reseniasDeOrganizador(resenias, eventos, usuarios) {
  return resenias
    .map((resenia) => detalleResenia(resenia, eventos.get(resenia.eventoId), usuarios.get(resenia.compradorId)))
    .sort((a, b) => b.evento.fecha - a.evento.fecha || b.id - a.id);
}
