import { EstadoCompra } from './estadoCompra.js';

// Las compras que reservan lugar. Una PENDIENTE también ocupa: si no, dos personas
// podrían comprar la última entrada y la segunda se enteraría recién al pagar.
// CANCELADA y REEMBOLSADA liberan el lugar.
export const ESTADOS_QUE_OCUPAN_CUPO = Object.freeze([
  EstadoCompra.PENDIENTE,
  EstadoCompra.CONFIRMADA,
  EstadoCompra.UTILIZADA,
]);

export function ocupaCupo(compra) {
  return ESTADOS_QUE_OCUPAN_CUPO.includes(compra.estado);
}
