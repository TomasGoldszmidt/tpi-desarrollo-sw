import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import * as compraDominio from '../domain/compra.js';
import {
  actualizarEstado, cantidadConMensajesNoLeidos, cantidadesPorEstado, conversaciones, detalleCompra, estadoAlCancelar,
  masRecientesPrimero, mensajesConAutor, nuevaCompra, ordenarPorImportancia, puedeVer, resumenVentas,
} from '../domain/compra.js';
import { verificarOrganizador } from '../domain/evento.js';
import { EstadoCompra } from '../domain/estadoCompra.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../http/errors.js';
import { paginar } from '../http/pagination.js';
import { usuariosPorId } from './usuarioService.js';
import { buscarEvento } from './eventoService.js';
import { reseniaDeCompra } from './reseniaService.js';

/** @typedef {import('../persistence/schemas.js').Compra} Compra */
/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {{ pagina: number, limite: number }} Pagina */

/** @returns {Compra} */
export function buscarCompra(id) {
  const compra = compraRepository.findById(id);
  if (!compra) throw new NotFoundError(`No existe la compra ${id}`);
  return compra;
}

const eventoDe = (compra) => eventoRepository.findById(compra.eventoId);

// Forma de la compra para la app, con la reseña del comprador. lector: quien pide, para
// contar los mensajes que todavía no leyó.
/** @param {Compra} compra @param {Usuario} [lector] */
export function detalle(compra, lector) {
  const evento = eventoDe(compra);
  return {
    ...detalleCompra(
      compra,
      evento,
      usuarioRepository.findById(compra.compradorId),
      usuarioRepository.findById(evento.organizadorId),
      lector,
    ),
    resenia: reseniaDeCompra(compra),
  };
}

// Caso de uso 1: las compras del usuario como comprador, de la más importante a la menos
// (ver ordenarPorImportancia), de a páginas. estado filtra; cantidades cuenta todas.
/** @param {Usuario} comprador @param {string | undefined} estado @param {Pagina} pagina */
export function comprasDe(comprador, estado, pagina) {
  const compras = ordenarPorImportancia(
    compraRepository.findByComprador(comprador.id).map((compra) => detalle(compra, comprador)),
  );
  const filtradas = estado ? compras.filter((compra) => compra.estado === estado) : compras;
  return paginar(filtradas, pagina, { cantidades: cantidadesPorEstado(compras) });
}

/** @param {Usuario} usuario */
export function verCompra(id, usuario) {
  const compra = buscarCompra(id);
  if (!puedeVer(compra, eventoDe(compra), usuario)) throw new ForbiddenError('No podés ver esta compra');
  return detalle(compra, usuario);
}

// Caso de uso 12.
/** @param {{ eventoId: number, tipoEntradaId: number, cantidad: number }} datos @param {Usuario} comprador */
export function comprar(datos, comprador, ahora = new Date()) {
  const evento = eventoRepository.findById(datos.eventoId);
  if (!evento) throw new ValidationError(`No existe el evento ${datos.eventoId}`);
  const nueva = nuevaCompra(datos, evento, compraRepository.findByEvento(evento.id), comprador, ahora);
  return detalle(compraRepository.create(nueva), comprador);
}

// Pago, utilización y cancelación son el mismo cambio de estado con otro destino; las reglas
// están en el dominio. destino recibe la compra porque al cancelar depende de su estado.
/** @param {(compra: Compra) => string} destino @param {Usuario} usuario */
function cambiarEstado(id, destino, usuario, ahora = new Date()) {
  const compra = buscarCompra(id);
  const { estado, historial } = actualizarEstado(compra, eventoDe(compra), destino(compra), usuario, ahora);
  return detalle(compraRepository.update(compra.id, { estado, historial }), usuario);
}

/** @param {Usuario} usuario */
export const pagar = (id, usuario, ahora) => cambiarEstado(id, () => EstadoCompra.CONFIRMADA, usuario, ahora);
/** @param {Usuario} usuario */
export const marcarUtilizada = (id, usuario, ahora) => cambiarEstado(id, () => EstadoCompra.UTILIZADA, usuario, ahora);
// PENDIENTE → CANCELADA, CONFIRMADA → REEMBOLSADA (casos de uso 7 y 8).
/** @param {Usuario} usuario */
export const cancelar = (id, usuario, ahora) => cambiarEstado(id, estadoAlCancelar, usuario, ahora);

// Chat de la compra (casos de uso 5 y 6), del mensaje más viejo al más nuevo.
/** @param {Usuario} usuario */
export function mensajesDe(id, usuario) {
  const compra = buscarCompra(id);
  if (!puedeVer(compra, eventoDe(compra), usuario)) {
    throw new ForbiddenError('Solo el comprador y el organizador pueden ver este chat');
  }
  return mensajesConAutor(compra.mensajes, usuariosPorId());
}

// Devuelve el mensaje nuevo con su autor.
/** @param {Usuario} usuario @param {string} texto */
export function enviarMensaje(id, usuario, texto, ahora = new Date()) {
  const compra = buscarCompra(id);
  const { mensajes, mensajesLeidosHasta } = compraDominio.enviarMensaje(compra, eventoDe(compra), usuario, texto, ahora);
  const guardada = compraRepository.update(compra.id, { mensajes, mensajesLeidosHasta });
  return mensajesConAutor([guardada.mensajes.at(-1)], usuariosPorId())[0];
}

// Al abrir el chat (o mientras está abierto) queda leído hasta ahora para quien lo pide.
/** @param {Usuario} usuario */
export function leerMensajes(id, usuario, ahora = new Date()) {
  const compra = buscarCompra(id);
  const { mensajesLeidosHasta } = compraDominio.leerMensajes(compra, eventoDe(compra), usuario, ahora);
  compraRepository.update(compra.id, { mensajesLeidosHasta });
}

// Caso de uso 2: las ventas de un evento, para su organizador, de a páginas.
// Con conMensajes es la bandeja de mensajes: solo las compras con chat, primero las que
// tienen mensajes sin leer, y noLeidas cuenta esas conversaciones en todas las páginas.
// Si no, suma el resumen (vendidas y recaudado) y cuántas hay en cada estado (los chips);
// estado filtra la lista, pero el resumen y las cantidades cuentan todas.
/** @param {Usuario} usuario @param {{ conMensajes?: boolean, estado?: string }} filtros @param {Pagina} pagina */
export function ventasDe(eventoId, usuario, { conMensajes, estado }, pagina) {
  const evento = buscarEvento(eventoId);
  verificarOrganizador(evento, usuario);

  const compras = compraRepository.findByEvento(evento.id);
  const delEstado = estado ? compras.filter((compra) => compra.estado === estado) : compras;
  const lista = conMensajes ? conversaciones(compras, evento, usuario) : masRecientesPrimero(delEstado);
  const extra = conMensajes
    ? { noLeidas: cantidadConMensajesNoLeidos(compras, evento, usuario) }
    : { resumen: resumenVentas(compras), cantidades: cantidadesPorEstado(compras) };
  // Se arma el detalle solo de las compras de la página pedida.
  const { resultados, ...datosPagina } = paginar(lista, pagina, extra);
  return { resultados: resultados.map((compra) => detalle(compra, usuario)), ...datosPagina };
}
