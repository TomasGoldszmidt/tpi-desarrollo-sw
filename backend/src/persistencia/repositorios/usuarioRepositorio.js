import { Coleccion } from '../coleccion.js';

// Documento: { id, nombre, apellido, favoritos: [eventoId] }
// Sin rol: un usuario es organizador si tiene eventos creados.
const usuarios = new Coleccion();

export function crear({ nombre, apellido }) {
  return usuarios.insertar({ nombre, apellido, favoritos: [] });
}

export function buscarPorId(id) {
  return usuarios.buscarPorId(id);
}

export function buscarTodos() {
  return usuarios.buscarTodos();
}

export function agregarFavorito(usuarioId, eventoId) {
  const usuario = usuarios.buscarPorId(usuarioId);
  if (!usuario) return null;
  if (usuario.favoritos.includes(Number(eventoId))) return usuario;

  return usuarios.actualizar(usuarioId, {
    favoritos: [...usuario.favoritos, Number(eventoId)],
  });
}

export function quitarFavorito(usuarioId, eventoId) {
  const usuario = usuarios.buscarPorId(usuarioId);
  if (!usuario) return null;

  return usuarios.actualizar(usuarioId, {
    favoritos: usuario.favoritos.filter((id) => id !== Number(eventoId)),
  });
}
