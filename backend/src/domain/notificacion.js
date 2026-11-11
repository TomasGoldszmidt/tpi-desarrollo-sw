import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as reseniaRepository from '../persistence/repositories/reseniaRepository.js';
import { ForbiddenError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Compra} Compra */

// Las notificaciones no se guardan: se calculan con lo que ya está guardado.
// Una notificación es algo que hizo OTRA persona en una compra en la que el usuario
// participa (como comprador o como organizador del evento), o una reseña de uno de
// sus eventos. Del usuario solo se guarda hasta cuándo las leyó.
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
/** @param {Compra} compra @param {Usuario} usuario */
function deCompra(compra, evento, usuario) {
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
    ...base,
  }));
  return [...cambios, ...mensajes].filter((notificacion) => notificacion.deId !== usuario.id);
}

/**
 * Las notificaciones del usuario, de la más reciente a la más vieja, con `leida`
 * según `notificacionesLeidasHasta`.
 * @param {Usuario} usuarioActivo
 */
export function notificacionesDe(usuarioActivo, id) {
  verificarPropio(usuarioActivo, id);
  const cuenta = usuarioRepository.findCuentaById(id);
  const leidasHasta = cuenta.notificacionesLeidasHasta;

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
    .map(({ deId, ...notificacion }) => {
      const de = usuarios.get(deId);
      return {
        ...notificacion,
        de: { id: de.id, nombre: de.nombre, apellido: de.apellido },
        leida: leidasHasta !== null && notificacion.fecha <= leidasHasta,
      };
    })
    .sort((a, b) => b.fecha - a.fecha);
}

// Al abrir la pantalla de notificaciones: las que hay hasta ahora quedan como leídas.
/** @param {Usuario} usuarioActivo */
export function marcarLeidas(usuarioActivo, id, ahora = new Date()) {
  verificarPropio(usuarioActivo, id);
  usuarioRepository.marcarNotificacionesLeidas(id, ahora);
}
