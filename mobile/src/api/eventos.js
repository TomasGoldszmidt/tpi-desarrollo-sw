import { request } from './client.js';

// Arma "?clave=valor&..." salteando los filtros vacíos.
function queryString(params) {
  const partes = Object.entries(params)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${clave}=${encodeURIComponent(valor)}`);
  return partes.length > 0 ? `?${partes.join('&')}` : '';
}

// Catálogo: eventos que todavía no se realizaron, con filtros opcionales.
// orden: 'fecha' | 'precio' | 'puntaje'. precioMin y precioMax: algún tipo de entrada en ese rango.
// Viene de a páginas: { resultados, pagina, limite, total, hayMas }.
export function buscarEventos({ texto, categoriaId, orden, precioMin, precioMax, pagina, limite } = {}) {
  return request(`/eventos${queryString({ texto: texto?.trim(), categoriaId, orden, precioMin, precioMax, pagina, limite })}`);
}

// Detalle: tipos de entrada con sus disponibles y el organizador con su puntaje.
export function getEvento(id) {
  return request(`/eventos/${id}`);
}

// Caso de uso 4: el organizador es el usuario activo. datos tiene la forma de NuevoEvento
// (nombre, descripcion, lugar, categoriaId, fecha en ISO, multimedia y tiposEntrada).
// Devuelve el evento creado, con la misma forma que el detalle.
export function crearEvento(datos) {
  return request('/eventos', { method: 'POST', body: datos });
}

// Caso de uso 2: las compras del evento en cualquier estado, de la más reciente a la
// más vieja. Solo para el organizador; las disponibles por tipo salen de getEvento.
// Vienen de a páginas: { resultados, pagina, limite, total, hayMas }.
// Con conMensajes es la bandeja de mensajes: solo las compras con chat, primero las que
// tienen mensajes sin leer, y la página suma noLeidas (conversaciones sin leer en total).
// Sin conMensajes la página suma resumen ({ vendidas, recaudado }) y cantidades por estado,
// y estado filtra la lista.
export function getVentasEvento(id, { conMensajes, estado, pagina = 1, limite = 10 } = {}) {
  return request(`/eventos/${id}/compras${queryString({ conMensajes, estado, pagina, limite })}`);
}
