import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import * as usuarioRepository from '../persistence/repositories/usuarioRepository.js';
import { BusinessRuleError, ForbiddenError, UnauthorizedError, ValidationError } from '../http/errors.js';

/** @typedef {import('../persistence/schemas.js').Usuario} Usuario */
/** @typedef {import('../persistence/schemas.js').Cuenta} Cuenta */

// Inicio de sesión, registro y edición del perfil. La contraseña nunca se guarda:
// se guarda `sal:hash` con scrypt (incluido en Node, sin dependencias).
// Después de entrar, la app sigue identificando al usuario con el header X-User-Id.

const KEY_LENGTH = 64;

export function hashContrasenia(contrasenia) {
  const sal = randomBytes(16).toString('hex');
  const hash = scryptSync(contrasenia, sal, KEY_LENGTH).toString('hex');
  return `${sal}:${hash}`;
}

export function verificarContrasenia(contrasenia, contraseniaHash) {
  const [sal, hash] = contraseniaHash.split(':');
  const esperado = Buffer.from(hash, 'hex');
  const calculado = scryptSync(contrasenia, sal, KEY_LENGTH);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

function verificarEmailLibre(email, exceptoId) {
  if (usuarioRepository.existsEmail(email, { exceptoId })) {
    throw new BusinessRuleError('Ya hay una cuenta con ese email.');
  }
}

/** @returns {Cuenta} */
export function registrar({ nombre, apellido, email, contrasenia }) {
  verificarEmailLibre(email);
  return usuarioRepository.create({ nombre, apellido, email, contraseniaHash: hashContrasenia(contrasenia) });
}

// El mismo mensaje si el email no existe o si la contraseña no coincide, para no
// revelar qué emails tienen cuenta.
/** @returns {Cuenta} */
export function iniciarSesion(email, contrasenia) {
  const guardado = usuarioRepository.findCredenciales(email);
  if (!guardado || !verificarContrasenia(contrasenia, guardado.contraseniaHash)) {
    throw new UnauthorizedError('El email o la contraseña no son correctos.');
  }
  return usuarioRepository.findCuentaById(guardado.id);
}

// Solo el propio usuario edita su perfil. Para cambiar la contraseña pide la actual.
/**
 * @param {Usuario} usuarioActivo
 * @param {number} id
 * @param {{ nombre?: string, apellido?: string, email?: string, contraseniaActual?: string, contraseniaNueva?: string }} cambios
 * @returns {Cuenta}
 */
export function actualizarPerfil(usuarioActivo, id, cambios) {
  if (usuarioActivo.id !== id) {
    throw new ForbiddenError('Solo podés editar tu propio perfil.');
  }
  const cuenta = usuarioRepository.findCuentaById(id);

  const { nombre, apellido, email, contraseniaActual, contraseniaNueva } = cambios;
  if (email !== undefined) verificarEmailLibre(email, id);

  let contraseniaHash;
  if (contraseniaNueva !== undefined) {
    if (contraseniaActual === undefined) {
      throw new ValidationError('Para cambiar la contraseña ingresá la actual.');
    }
    const guardado = usuarioRepository.findCredenciales(cuenta.email);
    if (!verificarContrasenia(contraseniaActual, guardado.contraseniaHash)) {
      throw new UnauthorizedError('La contraseña actual no es correcta.');
    }
    contraseniaHash = hashContrasenia(contraseniaNueva);
  }

  return usuarioRepository.update(id, { nombre, apellido, email, contraseniaHash });
}
