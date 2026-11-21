import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { cambiosDePerfil, nuevaCuenta, verificarCredenciales } from '../domain/cuenta.js';
import { buscarUsuario } from './usuarioService.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Cuenta} Cuenta */

// Casos de uso de la cuenta: registro, inicio de sesión y edición del perfil.

/** @returns {Cuenta} */
export function registrar(datos) {
  return usuarioRepository.create(nuevaCuenta(datos, usuarioRepository.existsEmail(datos.email)));
}

// No se guarda ninguna sesión: la app manda después el id en el header X-User-Id.
/** @returns {Cuenta} */
export function iniciarSesion(email, contrasenia) {
  const guardado = usuarioRepository.findCredenciales(email);
  verificarCredenciales(guardado, contrasenia);
  return usuarioRepository.findCuentaById(guardado.id);
}

/** @param {Usuario} usuarioActivo @param {number} id @returns {Cuenta} */
export function actualizarPerfil(usuarioActivo, id, cambios) {
  buscarUsuario(id);
  const cuenta = usuarioRepository.findCuentaById(id);
  const guardado = {
    emailEnUso: cambios.email !== undefined && usuarioRepository.existsEmail(cambios.email, { exceptoId: id }),
    contraseniaHash: usuarioRepository.findCredenciales(cuenta.email).contraseniaHash,
  };
  return usuarioRepository.update(id, cambiosDePerfil(usuarioActivo, id, cambios, guardado));
}
