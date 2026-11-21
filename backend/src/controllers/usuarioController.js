import * as usuarioService from '../services/usuarioService.js';
import * as reseniaService from '../services/reseniaService.js';
import * as cuentaService from '../services/cuentaService.js';
import { ValidationError } from '../http/errors.js';
import { requireContrasenia, requireEmail, requireId, requireString } from '../http/validation.js';

export async function list(req, res) {
  res.status(200).json(usuarioService.listarUsuarios());
}

// Público: lo usa la pantalla de reseñas del organizador para mostrar su nombre y puntaje.
export async function getById(req, res) {
  const id = requireId(req.params.id);
  res.status(200).json(reseniaService.perfilDe(id));
}

// Registro: crea la cuenta y la devuelve con el email (la app entra con ese usuario).
export async function create(req, res) {
  const body = req.body ?? {};
  const cuenta = cuentaService.registrar({
    nombre: requireString(body.nombre, 'nombre', { maxLength: 50 }),
    apellido: requireString(body.apellido, 'apellido', { maxLength: 50 }),
    email: requireEmail(body.email),
    contrasenia: requireContrasenia(body.contrasenia),
  });
  res.location(`/usuarios/${cuenta.id}`).status(201).json(cuenta);
}

// Edición del perfil: solo los campos que vienen. Para cambiar la contraseña hay que mandar la actual.
export async function update(req, res) {
  const id = requireId(req.params.id);
  const body = req.body ?? {};
  const cambios = {};
  if (body.nombre !== undefined) cambios.nombre = requireString(body.nombre, 'nombre', { maxLength: 50 });
  if (body.apellido !== undefined) cambios.apellido = requireString(body.apellido, 'apellido', { maxLength: 50 });
  if (body.email !== undefined) cambios.email = requireEmail(body.email);
  if (body.contraseniaNueva !== undefined) cambios.contraseniaNueva = requireContrasenia(body.contraseniaNueva, 'contraseniaNueva');
  if (body.contraseniaActual !== undefined) {
    cambios.contraseniaActual = requireContrasenia(body.contraseniaActual, 'contraseniaActual', { minLength: 1 });
  }
  if (Object.keys(cambios).length === 0) throw new ValidationError('No hay cambios para guardar');

  res.status(200).json(cuentaService.actualizarPerfil(req.usuario, id, cambios));
}
