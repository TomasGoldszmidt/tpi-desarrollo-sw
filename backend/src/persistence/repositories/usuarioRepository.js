import { Collection } from '../collection.js';

/** @typedef {import('../schemas.js').Usuario} Usuario */
/** @typedef {import('../schemas.js').Cuenta} Cuenta */
/** @typedef {import('../schemas.js').UsuarioGuardado} UsuarioGuardado */

const usuarios = new Collection();

// Lo que ven los demás: sin email, contraseña ni datos de la cuenta. Es lo que devuelven las consultas
// comunes, así el usuario se puede embeber en cualquier respuesta sin filtrar nada.
/** @returns {Usuario | null} */
function toUsuario(documento) {
  if (!documento) return null;
  const { email: _email, contraseniaHash: _hash, notificacionesLeidasHasta: _hasta, notificacionesLeidas: _leidas, ...usuario } = documento;
  return usuario;
}

// Lo que ve el propio usuario: con el email, sin la contraseña.
/** @returns {Cuenta | null} */
function toCuenta(documento) {
  if (!documento) return null;
  const { contraseniaHash: _hash, ...cuenta } = documento;
  return cuenta;
}

function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

/** @returns {Cuenta} */
export function create({ nombre, apellido, email, contraseniaHash }) {
  return toCuenta(usuarios.insert({ nombre, apellido, email: normalizarEmail(email), contraseniaHash, favoritos: [], notificacionesLeidasHasta: null, notificacionesLeidas: [] }));
}

/** @returns {Usuario | null} */
export function findById(id) {
  return toUsuario(usuarios.findById(id));
}

/** @returns {Usuario[]} */
export function findAll() {
  return usuarios.findAll().map(toUsuario);
}

/** @returns {Cuenta | null} */
export function findCuentaById(id) {
  return toCuenta(usuarios.findById(id));
}

// El documento completo, con la contraseña: solo para verificarla al iniciar sesión o cambiarla.
/** @returns {UsuarioGuardado | null} */
export function findCredenciales(email) {
  const buscado = normalizarEmail(email);
  return usuarios.findAll((u) => u.email === buscado)[0] ?? null;
}

/** @returns {boolean} */
export function existsEmail(email, { exceptoId } = {}) {
  const buscado = normalizarEmail(email);
  return usuarios.findAll((u) => u.email === buscado && u.id !== exceptoId).length > 0;
}

// Cambia nombre, apellido, email o contraseniaHash; lo que no venga queda igual.
/** @returns {Cuenta | null} */
export function update(id, { nombre, apellido, email, contraseniaHash }) {
  const cambios = Object.fromEntries(
    Object.entries({ nombre, apellido, email: email && normalizarEmail(email), contraseniaHash })
      .filter(([, valor]) => valor !== undefined),
  );
  return toCuenta(usuarios.update(id, cambios));
}

/** @returns {Usuario | null} */
export function addFavorito(usuarioId, eventoId) {
  const usuario = usuarios.findById(usuarioId);
  if (!usuario) return null;
  if (usuario.favoritos.includes(Number(eventoId))) return toUsuario(usuario);

  return toUsuario(usuarios.update(usuarioId, {
    favoritos: [...usuario.favoritos, Number(eventoId)],
  }));
}

/** @returns {Usuario | null} */
export function removeFavorito(usuarioId, eventoId) {
  const usuario = usuarios.findById(usuarioId);
  if (!usuario) return null;

  return toUsuario(usuarios.update(usuarioId, {
    favoritos: usuario.favoritos.filter((id) => id !== Number(eventoId)),
  }));
}

// Desde ahora, las notificaciones anteriores a esta fecha se muestran como leídas.
// Las que se habían leído una por una ya quedan cubiertas: se vacía la lista.
/** @returns {Cuenta | null} */
export function marcarNotificacionesLeidas(id, fecha = new Date()) {
  return toCuenta(usuarios.update(id, { notificacionesLeidasHasta: fecha, notificacionesLeidas: [] }));
}

// Una notificación abierta: queda leída aunque sea posterior a notificacionesLeidasHasta. Sin duplicados.
/** @returns {Cuenta | null} */
export function addNotificacionLeida(id, notificacionId) {
  const usuario = usuarios.findById(id);
  if (!usuario) return null;
  if (usuario.notificacionesLeidas.includes(notificacionId)) return toCuenta(usuario);
  return toCuenta(usuarios.update(id, { notificacionesLeidas: [...usuario.notificacionesLeidas, notificacionId] }));
}
