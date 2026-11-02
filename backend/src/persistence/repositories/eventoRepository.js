import { Collection } from '../collection.js';

/** @typedef {import('../schemas.js').Evento} Evento */

const eventos = new Collection();

// Pasa a minúsculas y saca las tildes, para buscar "musica" y encontrar "Música".
function normalize(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** @returns {Evento} */
export function create({ nombre, descripcion, lugar, categoriaId, organizadorId, fecha, multimedia = [], tiposEntrada }) {
  return eventos.insert({
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
export function findById(id) {
  return eventos.findById(id);
}

/** @returns {Evento[]} */
export function findAll() {
  return eventos.findAll();
}

// Los dos filtros son opcionales. El texto se busca en el nombre, la descripción y el lugar.
/** @returns {Evento[]} */
export function search({ texto, categoriaId } = {}) {
  const buscado = texto ? normalize(texto) : null;

  return eventos.findAll((evento) => {
    if (categoriaId && evento.categoriaId !== Number(categoriaId)) return false;
    if (!buscado) return true;
    return [evento.nombre, evento.descripcion, evento.lugar]
      .some((campo) => normalize(campo).includes(buscado));
  });
}

/** @returns {Evento[]} */
export function findByOrganizador(organizadorId) {
  return eventos.findAll((evento) => evento.organizadorId === Number(organizadorId));
}

/** @returns {Evento[]} */
export function findByIds(ids) {
  const buscados = new Set(ids.map(Number));
  return eventos.findAll((evento) => buscados.has(evento.id));
}
