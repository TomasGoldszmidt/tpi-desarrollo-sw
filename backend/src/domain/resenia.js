import { EstadoCompra } from './estadoCompra.js';
import * as reseniaRepository from '../persistence/repositories/reseniaRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { BusinessRuleError, ValidationError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Evento} Evento */
/** @typedef {import('../persistence/schemas.js').Resenia} Resenia */
/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */

// Puntaje de cada organizador: promedio de las reseñas de todos sus eventos. No se guarda.
// La reseña no lleva el organizador, así que se llega a él por el evento reseñado.
// Un organizador sin reseñas no aparece en el Map: su puntaje es null.
/**
 * @param {Evento[]} eventos Todos los eventos (para saber de quién es cada uno).
 * @param {Resenia[]} resenias
 * @returns {Map<number, { puntaje: number, cantidadResenias: number }>}
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

// Caso de uso 9: solo reseña quien usó su entrada, y una vez por evento.
// La forma (puntuación 1 a 5, detalle) llega validada por el controlador.
/** @param {{ eventoId: number, puntuacion: number, detalle: string }} datos @param {Usuario} comprador */
export function crearResenia({ eventoId, puntuacion, detalle }, comprador) {
  const evento = eventoRepository.findById(eventoId);
  if (!evento) throw new ValidationError(`No existe el evento ${eventoId}`);

  const asistio = compraRepository.findByComprador(comprador.id)
    .some((compra) => compra.eventoId === evento.id && compra.estado === EstadoCompra.UTILIZADA);
  if (!asistio) throw new BusinessRuleError('Solo podés reseñar eventos a los que asististe');

  if (reseniaRepository.findByCompradorAndEvento(comprador.id, evento.id)) {
    throw new BusinessRuleError('Ya reseñaste este evento');
  }

  const resenia = reseniaRepository.create({ compradorId: comprador.id, eventoId: evento.id, detalle, puntuacion });
  return detalleResenia(resenia, evento, comprador);
}

// Caso de uso 10: las reseñas de todos los eventos de un organizador, del evento
// más reciente al más viejo. Un usuario que no organiza nada no tiene reseñas.
/** @param {Usuario} organizador */
export function reseniasDeOrganizador(organizador) {
  const eventos = new Map(eventoRepository.findByOrganizador(organizador.id).map((e) => [e.id, e]));
  return reseniaRepository.findByEventos([...eventos.keys()])
    .map((resenia) => detalleResenia(resenia, eventos.get(resenia.eventoId), usuarioRepository.findById(resenia.compradorId)))
    .sort((a, b) => b.evento.fecha - a.evento.fecha || b.id - a.id);
}
