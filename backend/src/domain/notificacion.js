import { ForbiddenError, NotFoundError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Cuenta} Cuenta */
/** @typedef {import('../persistence/schemas.js').Compra} Compra */
/** @typedef {import('../persistence/schemas.js').Evento} Evento */
/** @typedef {import('../persistence/schemas.js').Resenia} Resenia */

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

/** @param {Usuario} usuarioActivo @param {number} id El dueño de las notificaciones. */
export function verificarPropias(usuarioActivo, id) {
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
 * nuevas con las anteriores: la app las muestra en dos secciones. Lo guardado lo junta el service.
 * @param {Cuenta} cuenta
 * @param {{
 *   participaciones: { compra: Compra, evento: Evento }[],
 *   misEventos: Evento[],
 *   resenias: Resenia[],
 *   usuarios: Map<number, Usuario>,
 * }} datos Las compras en las que participa (como comprador o como organizador), con su evento;
 *   los eventos que organiza, las reseñas de esos eventos y los usuarios por id.
 */
export function notificacionesDe(cuenta, { participaciones, misEventos, resenias, usuarios }) {
  const deCompras = participaciones.flatMap(({ compra, evento }) => deCompra(compra, evento, cuenta));

  const eventosPorId = new Map(misEventos.map((evento) => [evento.id, evento]));
  const deResenias = resenias
    .filter((resenia) => resenia.compradorId !== cuenta.id)
    .map((resenia) => ({
      id: `resenia-${resenia.id}`,
      tipo: 'RESENIA',
      puntuacion: resenia.puntuacion,
      fecha: resenia.fecha,
      deId: resenia.compradorId,
      evento: { id: resenia.eventoId, nombre: eventosPorId.get(resenia.eventoId).nombre },
    }));

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

// Al abrir una notificación: tiene que ser una de las del usuario.
/** @param {{ id: string }[]} notificaciones Las del usuario. @param {string} notificacionId */
export function verificarNotificacion(notificaciones, notificacionId) {
  if (!notificaciones.some((notificacion) => notificacion.id === notificacionId)) {
    throw new NotFoundError(`No existe la notificación ${notificacionId}`);
  }
}
