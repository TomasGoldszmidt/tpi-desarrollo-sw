// Estructura con la que se persiste cada documento en memoria.
// Única fuente de verdad en el código; el análisis de cada decisión está en docs/persistencia.md.
// Convención de relaciones: `xxxId` / `xxxIds` = referencia por id; objeto o array de objetos = embebido.
// Son solo tipos JSDoc (el editor los usa para autocompletar y avisar errores); no se ejecutan.

/**
 * Colección `usuarios`. Sin rol: es organizador si tiene eventos creados.
 * Es lo que ven los demás (organizador, comprador, autor de un mensaje): sin email ni contraseña.
 * @typedef {Object} Usuario
 * @property {number} id
 * @property {string} nombre
 * @property {string} apellido
 * @property {number[]} favoritos Ids de Evento (referencia).
 */

/**
 * El usuario visto por él mismo: lo que devuelven el inicio de sesión, el registro y la edición del perfil.
 * `notificacionesLeidasHasta`: la última vez que marcó todas como leídas (null si nunca);
 * las de antes se muestran como leídas. `notificacionesLeidas`: ids de las que abrió una por una.
 * @typedef {Usuario & { email: string, notificacionesLeidasHasta: Date | null, notificacionesLeidas: string[] }} Cuenta
 */

/**
 * El documento completo como se guarda. `contraseniaHash` es `sal:hash` en hex (scrypt) y
 * solo sale del repositorio con `findCredenciales`, para verificar la contraseña.
 * @typedef {Cuenta & { contraseniaHash: string }} UsuarioGuardado
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
 * Constante en código (`domain/estadoCompra.js`), no se persiste como colección.
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
 * @property {MensajesLeidosHasta} mensajesLeidosHasta Hasta cuándo leyó el chat cada participante.
 */

/**
 * Embebido en `Compra.mensajesLeidosHasta`. Por rol y no por id de usuario: en una compra
 * hay un solo comprador y un solo organizador. null si nunca abrió el chat.
 * @typedef {Object} MensajesLeidosHasta
 * @property {Date | null} comprador
 * @property {Date | null} organizador
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

/**
 * Colección `resenias`. No guarda el organizador: se llega por `evento.organizadorId`.
 * El puntaje del organizador se calcula promediando las reseñas de sus eventos.
 * @typedef {Object} Resenia
 * @property {number} id
 * @property {number} compradorId Id de Usuario (referencia).
 * @property {number} eventoId Id de Evento (referencia).
 * @property {string} detalle
 * @property {number} puntuacion
 * @property {Date} fecha Cuándo se escribió (para ordenarla entre las notificaciones).
 */

export {};
