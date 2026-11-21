import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as compraRepository from '../persistence/repositories/compraRepository.js';
import * as reseniaRepository from '../persistence/repositories/reseniaRepository.js';
import * as notificacionDominio from '../domain/notificacion.js';
import { verificarNotificacion, verificarPropias } from '../domain/notificacion.js';
import { paginar } from '../http/pagination.js';
import { buscarUsuario, usuariosPorId } from './usuarioService.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */

// Las notificaciones no se guardan: el dominio las calcula con lo que junta este service.

/** @param {Usuario} usuarioActivo */
export function notificacionesDe(usuarioActivo, id) {
  buscarUsuario(id);
  verificarPropias(usuarioActivo, id);

  const misEventos = eventoRepository.findByOrganizador(id);
  const comoComprador = compraRepository.findByComprador(id)
    .map((compra) => ({ compra, evento: eventoRepository.findById(compra.eventoId) }));
  const comoOrganizador = misEventos.flatMap((evento) =>
    compraRepository.findByEvento(evento.id).map((compra) => ({ compra, evento })));

  return notificacionDominio.notificacionesDe(usuarioRepository.findCuentaById(id), {
    participaciones: [...comoComprador, ...comoOrganizador],
    misEventos,
    resenias: reseniaRepository.findByEventos(misEventos.map((evento) => evento.id)),
    usuarios: usuariosPorId(),
  });
}

// De a páginas. noLeidas cuenta todas, no solo las de esta página: es el número de la campana.
/** @param {Usuario} usuarioActivo @param {{ pagina: number, limite: number }} pagina */
export function listarNotificaciones(usuarioActivo, id, pagina) {
  const notificaciones = notificacionesDe(usuarioActivo, id);
  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;
  return paginar(notificaciones, pagina, { noLeidas });
}

// "Marcar todas como leídas": las que hay hasta ahora quedan como leídas.
/** @param {Usuario} usuarioActivo */
export function marcarLeidas(usuarioActivo, id, ahora = new Date()) {
  buscarUsuario(id);
  verificarPropias(usuarioActivo, id);
  usuarioRepository.marcarNotificacionesLeidas(id, ahora);
}

// Al abrir una notificación: solo esa queda leída.
/** @param {Usuario} usuarioActivo @param {string} notificacionId */
export function marcarLeida(usuarioActivo, id, notificacionId) {
  verificarNotificacion(notificacionesDe(usuarioActivo, id), notificacionId);
  usuarioRepository.addNotificacionLeida(id, notificacionId);
}
