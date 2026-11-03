import { request } from './client.js';

// Caso de uso 9: el comprador reseña un evento al que asistió (compra UTILIZADA).
export function crearResenia({ eventoId, puntuacion, detalle }) {
  return request('/resenias', { method: 'POST', body: { eventoId, puntuacion, detalle } });
}
