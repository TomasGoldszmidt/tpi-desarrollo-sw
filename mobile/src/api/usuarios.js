import { request } from './client.js';

export function getUsuarios() {
  return request('/usuarios');
}
