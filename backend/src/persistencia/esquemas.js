// Estructura con la que se persiste cada documento en memoria.
// Única fuente de verdad en el código; el análisis de cada decisión está en docs/persistencia.md.
// Convención de relaciones: `xxxId` / `xxxIds` = referencia por id; objeto o array de objetos = embebido.
// Son solo tipos JSDoc (el editor los usa para autocompletar y avisar errores); no se ejecutan.

/**
 * Colección `usuarios`. Sin rol: es organizador si tiene eventos creados.
 * @typedef {Object} Usuario
 * @property {number} id
 * @property {string} nombre
 * @property {string} apellido
 * @property {number[]} favoritos Ids de Evento (referencia).
 */

/**
 * Colección `categorias`. Solo lectura para la API: la carga el seed.
 * @typedef {Object} Categoria
 * @property {number} id
 * @property {string} nombre
 * @property {string} descripcion
 */

export {};
