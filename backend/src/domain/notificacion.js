import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as reseniaRepository from '../persistence/repositories/reseniaRepository.js';
import { ForbiddenError, NotFoundError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Compra} Compra */

// Las notificaciones no se guardan: se calculan con lo que ya está guardado.
// Una notificación es algo que hizo OTRA persona en una compra en la que el usuario
// participa (como comprador o como organizador del evento), o una reseña de uno de
// sus eventos. Del usuario solo se guarda qué leyó: una fecha (al marcar todas) y los ids
// de las que abrió una por una. Las de mensajes también quedan leídas al abrir el chat.
//
// Tipos:
// - COMPRA: alguien compró entradas de un evento tuyo (el primer cambio del historial).
// - CAMBIO_ESTADO: el otro cambió el estado de la compra (pagó, canceló, se reembolsó,
//   o el organizador la marcó como utilizada). Lleva el estado nuevo.
// - MENSAJE: el otro escribió en el chat de la compra. Lleva el texto.
// - RESENIA: un comprador reseñó un evento tuyo. Lleva la puntuación.

function verificarPropio(usuarioActivo, id) {
  if (usuarioActivo.id !== id) {
    throw new ForbiddenError('Solo podés ver tus propias notificaciones.');
  }
}

// Lo que pasó en una compra hecho por alguien que no es el usuario.
// Los mensajes llevan `chatLeidoHasta`: hasta cuándo el usuario leyó ese chat.
/** @param {Compra} compra @param {Usuario} usuario */
function deCompra(compra, evento, usuario) {
  const rol = compra.compradorId === usuario.id ? 'comprador' : 'organizador';
  const chatLeidoHasta = compra.mensajesLeidosHasta[rol];
  const tipoEntrada = evento.tiposEntrada.find((tipo) => tipo.id === compra.tipoEntradaId);
  const base = {
    compra: { id: compra.id, estado: compra.estado, cantidad: compra.cantidad, tipoEntrada: tipoEntrada.nombre },
    evento: { id: evento.id, nombre: evento.nombre },
  };
  const cambios = compra.historial
    .map((cambio, i) => ({
      id: `compra-${compra.id}-estado-${i}`,
      tipo: i === 0 ? 'COMPRA' : 'CAMBIO_ESTADO',
      estado: cambio.estado,
      fecha: cambio.fechaHora,
      deId: cambio.usuarioId,
      ...base,
    }));
  const mensajes = compra.mensajes.map((mensaje, i) => ({
    id: `compra-${compra.id}-mensaje-${i}`,
    tipo: 'MENSAJE',
    mensaje: mensaje.mensaje,
    fecha: mensaje.enviado,
    deId: mensaje.usuarioId,
    chatLeidoHasta,
    ...base,
  }));
  return [...cambios, ...mensajes].filter((notificacion) => notificacion.deId !== usuario.id);
}

// Leída si es anterior a la última vez que marcó todas, si la abrió, o si es un mensaje
// de un chat que ya abrió.
function estaLeida(notificacion, chatLeidoHasta, cuenta) {
  const { fecha } = notificacion;
  const hasta = cuenta.notificacionesLeidasHasta;
  return (hasta !== null && fecha <= hasta)
    || cuenta.notificacionesLeidas.includes(notificacion.id)
    || (chatLeidoHasta !== undefined && chatLeidoHasta !== null && fecha <= chatLeidoHasta);
}

/**
 * Las notificaciones del usuario, con `leida`: primero las no leídas y, dentro de cada grupo,
 * de la más reciente a la más vieja (si empatan, por id). Así las páginas no mezclan las
 * nuevas con las anteriores: la app las muestra en dos secciones.
 * @param {Usuario} usuarioActivo
 */
export function notificacionesDe(usuarioActivo, id) {
  verificarPropio(usuarioActivo, id);
  const cuenta = usuarioRepository.findCuentaById(id);

  const misEventos = eventoRepository.findByOrganizador(id);
  const comoComprador = compraRepository.findByComprador(id)
    .map((compra) => ({ compra, evento: eventoRepository.findById(compra.eventoId) }));
  const comoOrganizador = misEventos.flatMap((evento) =>
    compraRepository.findByEvento(evento.id).map((compra) => ({ compra, evento })));

  const deCompras = [...comoComprador, ...comoOrganizador]
    .flatMap(({ compra, evento }) => deCompra(compra, evento, cuenta));

  const eventosPorId = new Map(misEventos.map((evento) => [evento.id, evento]));
  const deResenias = reseniaRepository.findByEventos([...eventosPorId.keys()])
    .filter((resenia) => resenia.compradorId !== id)
    .map((resenia) => ({
      id: `resenia-${resenia.id}`,
      tipo: 'RESENIA',
      puntuacion: resenia.puntuacion,
      fecha: resenia.fecha,
      deId: resenia.compradorId,
      evento: { id: resenia.eventoId, nombre: eventosPorId.get(resenia.eventoId).nombre },
    }));

  const usuarios = new Map(usuarioRepository.findAll().map((u) => [u.id, u]));
  return [...deCompras, ...deResenias]
    .map(({ deId, chatLeidoHasta, ...notificacion }) => {
      const de = usuarios.get(deId);
      return {
        ...notificacion,
        de: { id: de.id, nombre: de.nombre, apellido: de.apellido },
        leida: estaLeida(notificacion, chatLeidoHasta, cuenta),
      };
    })
    .sort((a, b) => a.leida - b.leida || b.fecha - a.fecha || a.id.localeCompare(b.id));
}

// "Marcar todas como leídas": las que hay hasta ahora quedan como leídas.
/** @param {Usuario} usuarioActivo */
export function marcarLeidas(usuarioActivo, id, ahora = new Date()) {
  verificarPropio(usuarioActivo, id);
  usuarioRepository.marcarNotificacionesLeidas(id, ahora);
}

// Al abrir una notificación: solo esa queda leída. Tiene que ser una de las del usuario.
/** @param {Usuario} usuarioActivo @param {string} notificacionId */
export function marcarLeida(usuarioActivo, id, notificacionId) {
  const existe = notificacionesDe(usuarioActivo, id).some((notificacion) => notificacion.id === notificacionId);
  if (!existe) throw new NotFoundError(`No existe la notificación ${notificacionId}`);
  usuarioRepository.addNotificacionLeida(id, notificacionId);
}
