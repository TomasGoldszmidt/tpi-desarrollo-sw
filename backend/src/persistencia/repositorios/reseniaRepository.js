import { Coleccion } from '../coleccion.js';

/** @typedef {import('../esquemas.js').Resenia} Resenia */

const resenias = new Coleccion();

// Que haya una compra UTILIZADA y que la puntuación esté en rango lo valida el dominio.
/** @returns {Resenia} */
export function crear({ compradorId, eventoId, detalle, puntuacion }) {
  return resenias.insertar({
    compradorId: Number(compradorId),
    eventoId: Number(eventoId),
    detalle,
    puntuacion: Number(puntuacion),
  });
}

/** @returns {Resenia[]} */
export function buscarTodos() {
  return resenias.buscarTodos();
}

// Para las reseñas de un organizador: se le pasan los ids de sus eventos.
/** @returns {Resenia[]} */
export function buscarPorEventos(eventoIds) {
  const buscados = new Set(eventoIds.map(Number));
  return resenias.buscarTodos((resenia) => buscados.has(resenia.eventoId));
}

/** @returns {Resenia | null} */
export function buscarPorCompradorYEvento(compradorId, eventoId) {
  const [resenia] = resenias.buscarTodos(
    (r) => r.compradorId === Number(compradorId) && r.eventoId === Number(eventoId),
  );
  return resenia ?? null;
}
