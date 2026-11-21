import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as usuarioRepository from '../src/persistence/repositories/usuarioRepository.js';
import {
  cambiosDePerfil, hashContrasenia, nuevaCuenta, verificarContrasenia, verificarCredenciales,
} from '../src/domain/cuenta.js';
import { actualizarPerfil, iniciarSesion, registrar } from '../src/services/cuentaService.js';
import { requireContrasenia, requireEmail } from '../src/http/validation.js';
import { BusinessRuleError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../src/http/errors.js';

const seed = loadSeed();

describe('contraseñas', () => {
  it('se guardan con hash y sal distinta cada vez', () => {
    const a = hashContrasenia('secreta123');
    const b = hashContrasenia('secreta123');
    assert.notEqual(a, b);
    assert.ok(!a.includes('secreta123'));
    assert.ok(verificarContrasenia('secreta123', a));
    assert.ok(!verificarContrasenia('otra12345', a));
  });

  it('las consultas comunes no devuelven ni el email ni el hash', () => {
    const { paredes } = seed.usuarios;
    assert.deepEqual(Object.keys(usuarioRepository.findById(paredes.id)).sort(), ['apellido', 'favoritos', 'id', 'nombre']);
    assert.ok(usuarioRepository.findAll().every((u) => !('email' in u) && !('contraseniaHash' in u)));
    assert.equal(usuarioRepository.findCuentaById(paredes.id).email, 'paredes@gmail.com');
    assert.equal('contraseniaHash' in usuarioRepository.findCuentaById(paredes.id), false);
  });
});

describe('inicio de sesión', () => {
  it('con los datos del seed devuelve la cuenta, sin el hash', () => {
    const cuenta = iniciarSesion('paredes@gmail.com', 'paredes1234');
    assert.equal(cuenta.id, seed.usuarios.paredes.id);
    assert.equal(cuenta.email, 'paredes@gmail.com');
    assert.equal('contraseniaHash' in cuenta, false);
  });

  it('no distingue mayúsculas en el email', () => {
    assert.equal(iniciarSesion('Paredes@GMail.com', 'paredes1234').id, seed.usuarios.paredes.id);
  });

  it('da el mismo error con contraseña incorrecta o email inexistente', () => {
    assert.throws(() => iniciarSesion('paredes@gmail.com', 'paredes'), { name: 'UnauthorizedError', message: 'El email o la contraseña no son correctos.' });
    assert.throws(() => iniciarSesion('nadie@gmail.com', 'paredes1234'), { name: 'UnauthorizedError', message: 'El email o la contraseña no son correctos.' });
  });
});

describe('registro', () => {
  it('crea la cuenta y después se puede iniciar sesión', () => {
    const cuenta = registrar({ nombre: 'Camila', apellido: 'Ríos', email: 'camila@gmail.com', contrasenia: 'camila1234' });
    assert.deepEqual(cuenta, { id: cuenta.id, nombre: 'Camila', apellido: 'Ríos', email: 'camila@gmail.com', favoritos: [], notificacionesLeidasHasta: null, notificacionesLeidas: [] });
    assert.equal(iniciarSesion('camila@gmail.com', 'camila1234').id, cuenta.id);
  });

  it('rechaza un email que ya tiene cuenta, aunque cambien las mayúsculas', () => {
    assert.throws(
      () => registrar({ nombre: 'Tomas', apellido: 'X', email: 'TOMAS@gmail.com', contrasenia: 'tomas1234' }),
      BusinessRuleError,
    );
  });
});

describe('edición del perfil', () => {
  const { dilollo, blanco } = seed.usuarios;

  it('cambia nombre y apellido sin tocar la contraseña', () => {
    const cuenta = actualizarPerfil(dilollo, dilollo.id, { apellido: 'Gómez Paz' });
    assert.equal(cuenta.apellido, 'Gómez Paz');
    assert.equal(cuenta.nombre, 'Lautaro');
    assert.equal(iniciarSesion('dilollo@gmail.com', 'dilollo1234').id, dilollo.id);
  });

  it('solo el propio usuario', () => {
    assert.throws(() => actualizarPerfil(blanco, dilollo.id, { nombre: 'X' }), ForbiddenError);
  });

  it('no deja usar el email de otra cuenta, pero sí repetir el propio', () => {
    assert.throws(() => actualizarPerfil(dilollo, dilollo.id, { email: 'blanco@gmail.com' }), BusinessRuleError);
    assert.equal(actualizarPerfil(dilollo, dilollo.id, { email: 'dilollo@gmail.com' }).email, 'dilollo@gmail.com');
  });

  it('para cambiar la contraseña pide la actual y la verifica', () => {
    assert.throws(() => actualizarPerfil(blanco, blanco.id, { contraseniaNueva: 'nueva12345' }), ValidationError);
    assert.throws(
      () => actualizarPerfil(blanco, blanco.id, { contraseniaActual: 'mal', contraseniaNueva: 'nueva12345' }),
      { name: 'UnauthorizedError', message: 'La contraseña actual no es correcta.' },
    );
    actualizarPerfil(blanco, blanco.id, { contraseniaActual: 'blanco1234', contraseniaNueva: 'nueva12345' });
    assert.equal(iniciarSesion('blanco@gmail.com', 'nueva12345').id, blanco.id);
    assert.throws(() => iniciarSesion('blanco@gmail.com', 'blanco1234'), UnauthorizedError);
  });

  it('de un usuario inexistente da NotFoundError', () => {
    assert.throws(() => actualizarPerfil(dilollo, 9999, { nombre: 'X' }), NotFoundError);
  });
});

// Funciones puras del dominio: reciben lo que averiguó el service, sin repositorios.
describe('dominio de la cuenta', () => {
  const usuario = { id: 1, nombre: 'Ana', apellido: 'Paz', favoritos: [] };
  const guardado = { id: 1, contraseniaHash: hashContrasenia('actual1234') };

  it('nuevaCuenta hashea la contraseña y rechaza un email en uso', () => {
    const datos = { nombre: 'Ana', apellido: 'Paz', email: 'ana@gmail.com', contrasenia: 'ana12345' };
    const cuenta = nuevaCuenta(datos, false);
    assert.deepEqual(Object.keys(cuenta).sort(), ['apellido', 'contraseniaHash', 'email', 'nombre']);
    assert.ok(verificarContrasenia('ana12345', cuenta.contraseniaHash));
    assert.throws(() => nuevaCuenta(datos, true), { name: 'BusinessRuleError', message: 'Ya hay una cuenta con ese email.' });
  });

  it('verificarCredenciales rechaza un email sin cuenta o una contraseña incorrecta', () => {
    assert.doesNotThrow(() => verificarCredenciales(guardado, 'actual1234'));
    assert.throws(() => verificarCredenciales(null, 'actual1234'), UnauthorizedError);
    assert.throws(() => verificarCredenciales(guardado, 'otra12345'), UnauthorizedError);
  });

  it('cambiosDePerfil no deja editar el perfil de otro', () => {
    assert.throws(
      () => cambiosDePerfil(usuario, 2, { nombre: 'X' }, { emailEnUso: false, contraseniaHash: guardado.contraseniaHash }),
      ForbiddenError,
    );
  });

  it('cambiosDePerfil pide la contraseña actual para cambiarla', () => {
    const datos = { emailEnUso: false, contraseniaHash: guardado.contraseniaHash };
    assert.throws(() => cambiosDePerfil(usuario, 1, { contraseniaNueva: 'nueva12345' }, datos), ValidationError);
    const cambios = cambiosDePerfil(usuario, 1, { contraseniaActual: 'actual1234', contraseniaNueva: 'nueva12345' }, datos);
    assert.ok(verificarContrasenia('nueva12345', cambios.contraseniaHash));
  });

  it('cambiosDePerfil rechaza un email que ya usa otra cuenta', () => {
    assert.throws(
      () => cambiosDePerfil(usuario, 1, { email: 'otro@gmail.com' }, { emailEnUso: true, contraseniaHash: guardado.contraseniaHash }),
      BusinessRuleError,
    );
  });
});

describe('validación de email y contraseña', () => {
  it('el email se normaliza y tiene que tener formato', () => {
    assert.equal(requireEmail('  Ana@Mail.com '), 'ana@mail.com');
    assert.throws(() => requireEmail('ana@mail'), ValidationError);
    assert.throws(() => requireEmail(''), ValidationError);
  });

  it('la contraseña tiene al menos 8 caracteres y no se recorta', () => {
    assert.equal(requireContrasenia(' 12345678 '), ' 12345678 ');
    assert.throws(() => requireContrasenia('1234567'), { message: 'La contraseña tiene que tener al menos 8 caracteres' });
    assert.throws(() => requireContrasenia(undefined), ValidationError);
  });
});
