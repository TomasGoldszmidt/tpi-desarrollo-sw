import { request } from './client.js';

// Caso de uso 12: el comprador es el usuario activo. La compra arranca PENDIENTE
// y el total lo calcula el backend.
export function crearCompra({ eventoId, tipoEntradaId, cantidad }) {
  return request('/compras', { method: 'POST', body: { eventoId, tipoEntradaId, cantidad } });
}

// Caso de uso 1: las compras del usuario activo, de la más reciente a la más vieja,
// con diasRestantes si están CONFIRMADAS.
export function getMisCompras() {
  return request('/compras');
}

// Detalle de una compra: la ven el comprador y el organizador del evento.
export function getCompra(id) {
  return request(`/compras/${id}`);
}

// Pago simulado: PENDIENTE → CONFIRMADA.
export function pagarCompra(id) {
  return request(`/compras/${id}/pago`, { method: 'POST' });
}

// Casos de uso 7 y 8: sin pagar queda CANCELADA; pagada, REEMBOLSADA.
export function cancelarCompra(id) {
  return request(`/compras/${id}/cancelacion`, { method: 'POST' });
}

// Casos de uso 5 y 6: el chat de la compra, cada mensaje con su autor.
export function getMensajes(id) {
  return request(`/compras/${id}/mensajes`);
}

export function enviarMensaje(id, mensaje) {
  return request(`/compras/${id}/mensajes`, { method: 'POST', body: { mensaje } });
}

// El chat queda leído hasta ahora para el usuario activo (y las notificaciones de sus mensajes).
export function marcarMensajesLeidos(id) {
  return request(`/compras/${id}/mensajes/lectura`, { method: 'PUT' });
}

// El organizador marca la entrada como usada (CONFIRMADA → UTILIZADA), desde el día
// del evento. Habilita al comprador a reseñar.
export function marcarUtilizada(id) {
  return request(`/compras/${id}/utilizacion`, { method: 'POST' });
}
