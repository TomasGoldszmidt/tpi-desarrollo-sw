import { ocupaCupo } from './compra.js';

/** @typedef {import('../persistence/schemas.js').TipoEntrada} TipoEntrada */
/** @typedef {import('../persistence/schemas.js').Compra} Compra */

// Entradas que quedan de un tipo. No se guarda: se calcula con las compras.
// `compras` pueden ser todas las del evento; se filtran las de este tipo.
/** @param {TipoEntrada} tipoEntrada @param {Compra[]} compras @returns {number} */
export function calcularDisponibles(tipoEntrada, compras) {
  const ocupadas = compras
    .filter((compra) => compra.tipoEntradaId === tipoEntrada.id && ocupaCupo(compra))
    .reduce((total, compra) => total + compra.cantidad, 0);
  return tipoEntrada.cupo - ocupadas;
}

// `TipoEntrada.hayCupoPara(Int)` del diagrama.
/** @param {TipoEntrada} tipoEntrada @param {Compra[]} compras @param {number} cantidad @returns {boolean} */
export function hayCupoPara(tipoEntrada, compras, cantidad) {
  return cantidad <= calcularDisponibles(tipoEntrada, compras);
}
