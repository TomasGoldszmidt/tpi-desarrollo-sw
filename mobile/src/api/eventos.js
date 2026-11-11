import { request } from './client.js';

// Arma "?clave=valor&..." salteando los filtros vacíos.
function queryString(params) {
  const partes = Object.entries(params)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${clave}=${encodeURIComponent(valor)}`);
  return partes.length > 0 ? `?${partes.join('&')}` : '';
}

// Catálogo: eventos que todavía no se realizaron, con filtros opcionales.
// orden: 'fecha' | 'precio' | 'puntaje'. Viene de a páginas: { resultados, pagina, limite, total, hayMas }.
export function buscarEventos({ texto, categoriaId, orden, pagina, limite } = {}) {
  return request(`/eventos${queryString({ texto: texto?.trim(), categoriaId, orden, pagina, limite })}`);
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
export function getVentasEvento(id) {
  return request(`/eventos/${id}/compras`);
}
