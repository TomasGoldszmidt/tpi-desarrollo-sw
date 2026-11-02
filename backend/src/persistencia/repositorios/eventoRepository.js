import { Coleccion } from '../coleccion.js';

/** @typedef {import('../esquemas.js').Evento} Evento */

const eventos = new Coleccion();

// Pasa a minúsculas y saca las tildes, para buscar "musica" y encontrar "Música".
function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** @returns {Evento} */
export function crear({ nombre, descripcion, lugar, categoriaId, organizadorId, fecha, multimedia = [], tiposEntrada }) {
  return eventos.insertar({
    nombre,
    descripcion,
    lugar,
    categoriaId: Number(categoriaId),
    organizadorId: Number(organizadorId),
    fecha: new Date(fecha),
    multimedia,
    tiposEntrada: tiposEntrada.map(({ nombre, descripcion, precio, cupo }, i) => ({
      id: i + 1,
      nombre,
      descripcion,
      precio,
      cupo,
    })),
  });
}

/** @returns {Evento | null} */
export function buscarPorId(id) {
  return eventos.buscarPorId(id);
}

/** @returns {Evento[]} */
export function buscarTodos() {
  return eventos.buscarTodos();
}

// Los dos filtros son opcionales. El texto se busca en el nombre, la descripción y el lugar.
/** @returns {Evento[]} */
export function buscar({ texto, categoriaId } = {}) {
  const buscado = texto ? normalizar(texto) : null;

  return eventos.buscarTodos((evento) => {
    if (categoriaId && evento.categoriaId !== Number(categoriaId)) return false;
    if (!buscado) return true;
    return [evento.nombre, evento.descripcion, evento.lugar]
      .some((campo) => normalizar(campo).includes(buscado));
  });
}

/** @returns {Evento[]} */
export function buscarPorOrganizador(organizadorId) {
  return eventos.buscarTodos((evento) => evento.organizadorId === Number(organizadorId));
}

/** @returns {Evento[]} */
export function buscarPorIds(ids) {
  const buscados = new Set(ids.map(Number));
  return eventos.buscarTodos((evento) => buscados.has(evento.id));
}
