import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import * as reseniaRepository from '../persistence/repositories/reseniaRepository.js';
import { calcularDisponibles } from './tipoEntrada.js';
import { calcularPuntajes } from './resenia.js';
import { BusinessRuleError, ForbiddenError, ValidationError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Evento} Evento */
/** @typedef {import('../persistence/schemas.js').Categoria} Categoria */
/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Compra} Compra */

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

// Caso de uso 4. Los datos llegan con la forma ya validada por el controlador;
// acá van las reglas que dependen del resto del sistema.
/** @param {Usuario} organizador @param {Date} [ahora] @returns {Evento} */
export function crearEvento(datos, organizador, ahora = new Date()) {
  if (!categoriaRepository.findById(datos.categoriaId)) {
    throw new ValidationError(`No existe la categoría ${datos.categoriaId}`);
  }
  if (datos.fecha <= ahora) {
    throw new BusinessRuleError('La fecha del evento tiene que ser futura');
  }
  // Dos "Platea" en el mismo evento confundirían al comprador y a las ventas por tipo.
  const nombres = datos.tiposEntrada.map(({ nombre }) => nombre.trim().toLowerCase());
  if (new Set(nombres).size !== nombres.length) {
    throw new BusinessRuleError('Hay tipos de entrada con el nombre repetido');
  }

  return eventoRepository.create({ ...datos, organizadorId: organizador.id });
}

// Forma del evento para la app: resúmenes de categoría y organizador (con su puntaje, como
// en el catálogo) en lugar de sus ids, y las entradas disponibles de cada tipo (calculadas, no guardadas).
/**
 * @param {Evento} evento @param {Compra[]} compras Las compras del evento.
 * @param {Categoria} categoria @param {Usuario} organizador
 * @param {{ puntaje: number | null, cantidadResenias: number }} puntaje El del organizador (ver puntajeDe).
 */
export function detalleEvento(evento, compras, categoria, organizador, { puntaje, cantidadResenias }) {
  const { categoriaId: _categoriaId, organizadorId: _organizadorId, ...resto } = evento;
  return {
    ...resto,
    categoria: { id: categoria.id, nombre: categoria.nombre },
    organizador: { id: organizador.id, nombre: organizador.nombre, apellido: organizador.apellido, puntaje, cantidadResenias },
    tiposEntrada: evento.tiposEntrada.map((tipo) => ({ ...tipo, disponibles: calcularDisponibles(tipo, compras) })),
  };
}

// Precio con el que se ordena y se muestra un evento: su entrada más barata.
/** @param {Evento} evento @returns {number} */
export function precioDesde(evento) {
  return Math.min(...evento.tiposEntrada.map(({ precio }) => precio));
}

// Casos de uso 3 y 11. Dirección fija: fecha y precio de menor a mayor, puntaje de mayor
// a menor con los organizadores sin reseñas al final. Si empatan, desempata la fecha.
const porFecha = (a, b) => a.fecha - b.fecha;
const COMPARADORES = {
  fecha: porFecha,
  precio: (a, b) => a.precioDesde - b.precioDesde || porFecha(a, b),
  puntaje: (a, b) => (b.organizador.puntaje ?? -1) - (a.organizador.puntaje ?? -1) || porFecha(a, b),
};
export const ORDENES = Object.freeze(Object.keys(COMPARADORES));

// Forma de cada evento en el catálogo: lo que necesita la tarjeta, sin los tipos de entrada.
function resumenEvento(evento, categoria, organizador, puntajes) {
  const { puntaje = null, cantidadResenias = 0 } = puntajes.get(organizador.id) ?? {};
  return {
    id: evento.id,
    nombre: evento.nombre,
    lugar: evento.lugar,
    fecha: evento.fecha,
    imagen: evento.multimedia[0] ?? null,
    categoria: { id: categoria.id, nombre: categoria.nombre },
    organizador: { id: organizador.id, nombre: organizador.nombre, apellido: organizador.apellido, puntaje, cantidadResenias },
    precioDesde: precioDesde(evento),
  };
}

// Arma los resúmenes de una lista de eventos, buscando de una vez las categorías,
// los organizadores y los puntajes.
function resumenes(eventos) {
  const puntajes = calcularPuntajes(eventoRepository.findAll(), reseniaRepository.findAll());
  const categorias = new Map(categoriaRepository.findAll().map((c) => [c.id, c]));
  const usuarios = new Map(usuarioRepository.findAll().map((u) => [u.id, u]));
  return eventos.map((evento) =>
    resumenEvento(evento, categorias.get(evento.categoriaId), usuarios.get(evento.organizadorId), puntajes));
}

// Los filtros llegan validados por el controlador; todos son opcionales.
// Los eventos que ya se realizaron no se muestran: el catálogo es para comprar.
export function buscarEventos({ texto, categoriaId, precioMin, precioMax, orden = 'fecha' } = {}, ahora = new Date()) {
  const eventos = eventoRepository.search({ texto, categoriaId })
    .filter((evento) => !yaSeRealizo(evento, ahora) && tuPrecioEstaEntre(evento, precioMin, precioMax));
  return resumenes(eventos).sort(COMPARADORES[orden]);
}

// Los eventos que organiza el usuario, incluidos los pasados: los necesita para ver
// las ventas y marcar entradas como utilizadas.
/** @param {Usuario} organizador */
export function eventosOrganizados(organizador) {
  return resumenes(eventoRepository.findByOrganizador(organizador.id)).sort(porFecha);
}

// Los eventos favoritos del usuario, incluidos los que ya se realizaron, ordenados por fecha.
/** @param {Usuario} usuario */
export function eventosFavoritos(usuario) {
  return resumenes(eventoRepository.findByIds(usuario.favoritos)).sort(porFecha);
}

// Caso de uso 2: las ventas de un evento solo las ve su organizador.
/** @param {Evento} evento @param {Usuario} usuario */
export function verificarOrganizador(evento, usuario) {
  if (evento.organizadorId !== usuario.id) {
    throw new ForbiddenError('Solo el organizador puede ver las ventas de este evento');
  }
}
