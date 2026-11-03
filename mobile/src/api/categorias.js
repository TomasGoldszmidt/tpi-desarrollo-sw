import { request } from './client.js';

export function getCategorias() {
  return request('/categorias');
}
