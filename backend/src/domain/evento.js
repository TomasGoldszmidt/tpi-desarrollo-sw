/** @typedef {import('../persistence/schemas.js').Evento} Evento */

// `Evento.tuPrecioEstaEntre(Int, Int)` del diagrama: alcanza con que un tipo de entrada
// tenga un precio en el rango, con los extremos incluidos. Cualquiera de los dos
// límites puede faltar (sin `max` es "desde $min").
/** @param {Evento} evento @param {number} [min] @param {number} [max] @returns {boolean} */
export function tuPrecioEstaEntre(evento, min, max) {
  return evento.tiposEntrada.some(({ precio }) =>
    (min == null || precio >= min) && (max == null || precio <= max));
}

// Un evento se realizó cuando llegó su fecha y hora. Después ya no se puede pagar ni cancelar.
/** @param {Evento} evento @param {Date} [ahora] @returns {boolean} */
export function yaSeRealizo(evento, ahora = new Date()) {
  return evento.fecha <= ahora;
}

// Las entradas se pueden marcar como utilizadas desde las 00:00 del día del evento,
// sin límite hacia adelante: el organizador puede cargarlas tarde.
/** @param {Evento} evento @param {Date} [ahora] @returns {boolean} */
export function esElDiaOPosterior(evento, ahora = new Date()) {
  const inicioDelDia = new Date(evento.fecha);
  inicioDelDia.setHours(0, 0, 0, 0);
  return inicioDelDia <= ahora;
}
