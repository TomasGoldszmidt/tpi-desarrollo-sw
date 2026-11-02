/** @typedef {import('../persistence/schemas.js').Evento} Evento */

// `Evento.tuPrecioEstaEntre(Int, Int)` del diagrama: alcanza con que un tipo de entrada
// tenga un precio en el rango, con los extremos incluidos. Cualquiera de los dos
// límites puede faltar (sin `max` es "desde $min").
/** @param {Evento} evento @param {number} [min] @param {number} [max] @returns {boolean} */
export function tuPrecioEstaEntre(evento, min, max) {
  return evento.tiposEntrada.some(({ precio }) =>
    (min == null || precio >= min) && (max == null || precio <= max));
}
