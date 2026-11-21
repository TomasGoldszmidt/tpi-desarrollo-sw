import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
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

// El email es único: emailEnUso lo averigua el service (si otra cuenta ya lo tiene).
function verificarEmailLibre(emailEnUso) {
  if (emailEnUso) throw new BusinessRuleError('Ya hay una cuenta con ese email.');
}

// Registro. Devuelve los datos de la cuenta nueva, con la contraseña ya hasheada; la guarda el service.
/** @param {boolean} emailEnUso */
export function nuevaCuenta({ nombre, apellido, email, contrasenia }, emailEnUso) {
  verificarEmailLibre(emailEnUso);
  return { nombre, apellido, email, contraseniaHash: hashContrasenia(contrasenia) };
}

// Inicio de sesión. El mismo mensaje si el email no existe (guardado es null) o si la
// contraseña no coincide, para no revelar qué emails tienen cuenta.
/** @param {import('../persistence/schemas.js').UsuarioGuardado | null} guardado @param {string} contrasenia */
export function verificarCredenciales(guardado, contrasenia) {
  if (!guardado || !verificarContrasenia(contrasenia, guardado.contraseniaHash)) {
    throw new UnauthorizedError('El email o la contraseña no son correctos.');
  }
}

// Solo el propio usuario edita su perfil. Para cambiar la contraseña pide la actual.
// Devuelve los cambios a guardar (con la contraseña nueva hasheada); los guarda el service.
/**
 * @param {Usuario} usuarioActivo
 * @param {number} id
 * @param {{ nombre?: string, apellido?: string, email?: string, contraseniaActual?: string, contraseniaNueva?: string }} cambios
 * @param {{ emailEnUso: boolean, contraseniaHash: string }} guardado Si el email nuevo ya lo usa otra cuenta, y el hash actual.
 */
export function cambiosDePerfil(usuarioActivo, id, cambios, guardado) {
  if (usuarioActivo.id !== id) {
    throw new ForbiddenError('Solo podés editar tu propio perfil.');
  }

  const { nombre, apellido, email, contraseniaActual, contraseniaNueva } = cambios;
  if (email !== undefined) verificarEmailLibre(guardado.emailEnUso);

  let contraseniaHash;
  if (contraseniaNueva !== undefined) {
    if (contraseniaActual === undefined) {
      throw new ValidationError('Para cambiar la contraseña ingresá la actual.');
    }
    if (!verificarContrasenia(contraseniaActual, guardado.contraseniaHash)) {
      throw new UnauthorizedError('La contraseña actual no es correcta.');
    }
    contraseniaHash = hashContrasenia(contraseniaNueva);
  }

  return { nombre, apellido, email, contraseniaHash };
}
