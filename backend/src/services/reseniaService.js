import * as reseniaRepository from '../persistence/repositories/reseniaRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import {
  calcularPuntajes, detalleResenia, nuevaResenia, perfilUsuario, reseniasDeOrganizador, resumenResenia,
} from '../domain/resenia.js';
import { ValidationError } from '../http/errors.js';
import { paginar } from '../http/pagination.js';
import { buscarUsuario, usuariosPorId } from './usuarioService.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Compra} Compra */

// El puntaje de todos los organizadores, calculado con todos los eventos y reseñas.
/** @returns {import('../domain/resenia.js').Puntajes} */
export function puntajesDeOrganizadores() {
  return calcularPuntajes(eventoRepository.findAll(), reseniaRepository.findAll());
}

// GET /usuarios/:id: el usuario con su puntaje como organizador (caso de uso 10).
export function perfilDe(id) {
  return perfilUsuario(buscarUsuario(id), puntajesDeOrganizadores());
}

// La reseña que dejó el comprador de la compra para ese evento, o null (va en el detalle de la compra).
/** @param {Compra} compra */
export function reseniaDeCompra(compra) {
  return resumenResenia(reseniaRepository.findByCompradorAndEvento(compra.compradorId, compra.eventoId));
}

// Caso de uso 9.
/** @param {{ eventoId: number, puntuacion: number, detalle: string }} datos @param {Usuario} comprador */
export function crearResenia({ eventoId, puntuacion, detalle }, comprador) {
  const evento = eventoRepository.findById(eventoId);
  if (!evento) throw new ValidationError(`No existe el evento ${eventoId}`);

  const datos = nuevaResenia(
    { puntuacion, detalle },
    evento,
    compraRepository.findByComprador(comprador.id),
    reseniaRepository.findByCompradorAndEvento(comprador.id, evento.id),
    comprador,
  );
  return detalleResenia(reseniaRepository.create(datos), evento, comprador);
}

// Caso de uso 10: las reseñas que recibió un organizador en todos sus eventos.
export function reseniasDe(organizadorId) {
  const organizador = buscarUsuario(organizadorId);
  const eventos = new Map(eventoRepository.findByOrganizador(organizador.id).map((evento) => [evento.id, evento]));
  return reseniasDeOrganizador(reseniaRepository.findByEventos([...eventos.keys()]), eventos, usuariosPorId());
}

/** @param {{ pagina: number, limite: number }} pagina */
export function listarReseniasDe(organizadorId, pagina) {
  return paginar(reseniasDe(organizadorId), pagina);
}
