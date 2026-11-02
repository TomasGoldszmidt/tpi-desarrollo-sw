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

/**
 * Constante en código (`dominio/estadoCompra.js`), no se persiste como colección.
 * @typedef {'PENDIENTE' | 'CONFIRMADA' | 'UTILIZADA' | 'CANCELADA' | 'REEMBOLSADA'} EstadoCompra
 */

/**
 * Colección `compras`. El historial y el chat van embebidos. `total` se guarda
 * aunque se pueda calcular: es lo que se pagó y lo que se reembolsa.
 * @typedef {Object} Compra
 * @property {number} id
 * @property {number} compradorId Id de Usuario (referencia).
 * @property {number} eventoId Id de Evento (referencia).
 * @property {number} tipoEntradaId Id local dentro de `Evento.tiposEntrada` (referencia).
 * @property {number} cantidad
 * @property {number} total Precio al momento de comprar × cantidad.
 * @property {EstadoCompra} estado Estado actual; se escribe junto con el historial.
 * @property {CambioEstadoCompra[]} historial Embebido, en orden cronológico.
 * @property {Mensaje[]} mensajes Embebidos: el chat de la compra.
 */

/**
 * Embebido en `Compra.historial`. No lleva la compra: ya está dentro de ella.
 * @typedef {Object} CambioEstadoCompra
 * @property {EstadoCompra} estado
 * @property {number} usuarioId Id de Usuario que hizo el cambio (referencia).
 * @property {Date} fechaHora
 */

/**
 * Embebido en `Compra.mensajes`. Sin id: nadie lo referencia.
 * @typedef {Object} Mensaje
 * @property {number} usuarioId Id de Usuario que lo envió (referencia).
 * @property {string} mensaje
 * @property {Date} enviado
 */

export {};
