/** @typedef {import('../persistence/schemas.js').Evento} Evento */
/** @typedef {import('../persistence/schemas.js').Resenia} Resenia */

// Puntaje de cada organizador: promedio de las reseñas de todos sus eventos. No se guarda.
// La reseña no lleva el organizador, así que se llega a él por el evento reseñado.
// Un organizador sin reseñas no aparece en el Map: su puntaje es null.
/**
 * @param {Evento[]} eventos Todos los eventos (para saber de quién es cada uno).
 * @param {Resenia[]} resenias
 * @returns {Map<number, { puntaje: number, cantidadResenias: number }>}
 */
export function calcularPuntajes(eventos, resenias) {
  const organizadorDe = new Map(eventos.map((evento) => [evento.id, evento.organizadorId]));
  const sumas = new Map();
  for (const resenia of resenias) {
    const organizadorId = organizadorDe.get(resenia.eventoId);
    const { total = 0, cantidad = 0 } = sumas.get(organizadorId) ?? {};
    sumas.set(organizadorId, { total: total + resenia.puntuacion, cantidad: cantidad + 1 });
  }

  return new Map([...sumas].map(([organizadorId, { total, cantidad }]) =>
    [organizadorId, { puntaje: total / cantidad, cantidadResenias: cantidad }]));
}
