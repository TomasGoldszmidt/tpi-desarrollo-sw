import * as cuentaService from '../services/cuentaService.js';
import { requireEmail, requireContrasenia } from '../http/validation.js';

// Inicio de sesión: verifica email y contraseña y devuelve la cuenta. No se guarda
// ninguna sesión: la app manda después el id en el header X-User-Id.
export async function create(req, res) {
  const body = req.body ?? {};
  const email = requireEmail(body.email);
  const contrasenia = requireContrasenia(body.contrasenia, 'contrasenia', { minLength: 1 });
  res.status(200).json(cuentaService.iniciarSesion(email, contrasenia));
}
