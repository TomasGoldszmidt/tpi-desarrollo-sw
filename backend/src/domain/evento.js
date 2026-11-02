import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import * as categoriaRepository from '../persistence/repositories/categoriaRepository.js';
import { calcularDisponibles } from './tipoEntrada.js';
import { BusinessRuleError, ValidationError } from '../http/errors.js';

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

// Forma del evento para la app: resúmenes de categoría y organizador en lugar de sus ids,
// y las entradas disponibles de cada tipo (calculadas, no guardadas).
/** @param {Evento} evento @param {Compra[]} compras Las compras del evento. @param {Categoria} categoria @param {Usuario} organizador */
export function detalleEvento(evento, compras, categoria, organizador) {
  const { categoriaId: _categoriaId, organizadorId: _organizadorId, ...resto } = evento;
  return {
    ...resto,
    categoria: { id: categoria.id, nombre: categoria.nombre },
    organizador: { id: organizador.id, nombre: organizador.nombre, apellido: organizador.apellido },
    tiposEntrada: evento.tiposEntrada.map((tipo) => ({ ...tipo, disponibles: calcularDisponibles(tipo, compras) })),
  };
}
