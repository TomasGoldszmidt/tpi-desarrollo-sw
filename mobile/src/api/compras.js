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
