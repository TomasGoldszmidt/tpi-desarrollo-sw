import * as usuarioRepository from '../../persistence/repositories/usuarioRepository.js';
import { UnauthorizedError } from '../errors.js';

// Después de iniciar sesión (POST /sesiones), la app manda el usuario activo en el header X-User-Id.
// Se usa solo en las rutas que necesitan saber quién hace el pedido.
export function requireUsuario(req, res, next) {
  const header = req.get('X-User-Id');
  const id = Number(header);
  if (!header) throw new UnauthorizedError();
  if (!Number.isInteger(id) || id < 1) {
    throw new UnauthorizedError('El header X-User-Id tiene que ser un id válido');
  }

  const usuario = usuarioRepository.findById(id);
  if (!usuario) throw new UnauthorizedError(`No existe el usuario ${id}`);

  req.usuario = usuario;
  next();
}
