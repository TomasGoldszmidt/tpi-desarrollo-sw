import { Collection } from '../collection.js';

/** @typedef {import('../schemas.js').Resenia} Resenia */

const resenias = new Collection();

// Que haya una compra UTILIZADA y que la puntuación esté en rango lo valida el dominio.
/** @returns {Resenia} */
export function create({ compradorId, eventoId, detalle, puntuacion, fecha = new Date() }) {
  return resenias.insert({
    compradorId: Number(compradorId),
    eventoId: Number(eventoId),
    detalle,
    puntuacion: Number(puntuacion),
    fecha,
  });
}

/** @returns {Resenia[]} */
export function findAll() {
  return resenias.findAll();
}

// Para las reseñas de un organizador: se le pasan los ids de sus eventos.
/** @returns {Resenia[]} */
export function findByEventos(eventoIds) {
  const buscados = new Set(eventoIds.map(Number));
  return resenias.findAll((resenia) => buscados.has(resenia.eventoId));
}

/** @returns {Resenia | null} */
export function findByCompradorAndEvento(compradorId, eventoId) {
  const [resenia] = resenias.findAll(
    (r) => r.compradorId === Number(compradorId) && r.eventoId === Number(eventoId),
  );
  return resenia ?? null;
}
