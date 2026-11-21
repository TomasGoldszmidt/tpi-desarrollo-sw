import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import * as eventoRepository from '../persistence/repositories/eventoRepository.js';
import { eventosFavoritos } from '../domain/evento.js';
import { verificarPropios } from '../domain/favorito.js';
import { buscarUsuario } from './usuarioService.js';
import { buscarEvento, contextoResumenes } from './eventoService.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */

// Los eventos favoritos del usuario, incluidos los que ya se realizaron, ordenados por fecha.
/** @param {Usuario} usuarioActivo */
export function favoritosDe(usuarioActivo, id) {
  const usuario = buscarUsuario(id);
  verificarPropios(usuarioActivo, id);
  return eventosFavoritos(eventoRepository.findByIds(usuario.favoritos), contextoResumenes());
}

/** @param {Usuario} usuarioActivo */
export function marcarFavorito(usuarioActivo, id, eventoId) {
  buscarUsuario(id);
  verificarPropios(usuarioActivo, id);
  buscarEvento(eventoId);
  usuarioRepository.addFavorito(id, eventoId);
}

// Quitar uno que no estaba no es un error: el resultado es el mismo.
/** @param {Usuario} usuarioActivo */
export function desmarcarFavorito(usuarioActivo, id, eventoId) {
  buscarUsuario(id);
  verificarPropios(usuarioActivo, id);
  usuarioRepository.removeFavorito(id, eventoId);
}
