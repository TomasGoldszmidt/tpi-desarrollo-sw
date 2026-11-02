import { AppError, NotFoundError } from '../errors.js';

// Va después de todas las rutas: cualquier URL que no matcheó es un 404.
export function notFound(req, res) {
  throw new NotFoundError(`No existe la ruta ${req.method} ${req.path}`);
}

// Convierte cualquier error en { error: mensaje }. Express 5 trae hasta acá
// también los errores de los handlers async.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Body que no es JSON válido (lo detecta express.json()).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo del pedido no es un JSON válido' });
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
