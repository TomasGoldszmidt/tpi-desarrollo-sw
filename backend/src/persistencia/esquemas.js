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

/**
 * Colección `eventos`. Las entradas disponibles, el precio mínimo y el puntaje
 * del organizador no se guardan: se calculan.
 * @typedef {Object} Evento
 * @property {number} id
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string} lugar Nombre y dirección, en texto libre.
 * @property {number} categoriaId Id de Categoria (referencia).
 * @property {number} organizadorId Id de Usuario (referencia).
 * @property {Date} fecha
 * @property {string[]} multimedia URLs de imágenes o videos.
 * @property {TipoEntrada[]} tiposEntrada Embebidos.
 */

/**
 * Embebido en `Evento.tiposEntrada`. El id es local al evento (1..n):
 * una compra lo referencia con `eventoId` + `tipoEntradaId`.
 * @typedef {Object} TipoEntrada
 * @property {number} id
 * @property {string} nombre
 * @property {string} descripcion
 * @property {number} precio
 * @property {number} cupo Cupo total; las disponibles se calculan con las compras.
 */

export {};
