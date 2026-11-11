import { ValidationError } from './errors.js';
import { requireInteger } from './validation.js';

// Paginación de los listados que pueden crecer (catálogo, compras, reseñas, notificaciones…).
// Es por número de página: ?pagina=1&limite=10. No es una regla de negocio: el dominio
// arma la lista completa y ordenada, y acá solo se corta.

export const LIMITE_POR_DEFECTO = 10;
export const LIMITE_MAXIMO = 50;

// Un parámetro vacío (?pagina=) cuenta como ausente, igual que los filtros.
function parametro(query, campo, porDefecto, rango) {
  const valor = query[campo];
  if (valor === undefined || valor === '') return porDefecto;
  // ?pagina=1&pagina=2 llega como array.
  if (typeof valor !== 'string') throw new ValidationError(`El campo ${campo} tiene que ser un solo número`);
  return requireInteger(valor, campo, rango);
}

/** @returns {{ pagina: number, limite: number }} */
export function parsePagina(query = {}) {
  return {
    pagina: parametro(query, 'pagina', 1, { min: 1 }),
    limite: parametro(query, 'limite', LIMITE_POR_DEFECTO, { min: 1, max: LIMITE_MAXIMO }),
  };
}

// Devuelve la página pedida de la lista. extra suma campos propios del listado
// (ej: noLeidas en notificaciones). Una página después de la última viene vacía.
export function paginar(lista, { pagina, limite }, extra = {}) {
  const desde = (pagina - 1) * limite;
  return {
    resultados: lista.slice(desde, desde + limite),
    pagina,
    limite,
    total: lista.length,
    hayMas: desde + limite < lista.length,
    ...extra,
  };
}
