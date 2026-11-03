import { AppError, MethodNotAllowedError, NotFoundError } from '../errors.js';

// Va después de todas las rutas: cualquier URL que no matcheó es un 404.
export function notFound(req, res) {
  throw new NotFoundError(`No existe la ruta ${req.method} ${req.path}`);
}

// Va al final de cada `router.route(...)`: la URL existe pero no con ese método.
// `req.route.methods` tiene los métodos que se registraron en esa ruta.
export function methodNotAllowed(req, res) {
  const permitidos = Object.keys(req.route.methods).filter((m) => m !== '_all').map((m) => m.toUpperCase());
  throw new MethodNotAllowedError(req.method, permitidos);
}

// Errores que lanza express.json() antes de llegar a las rutas.
const ERRORES_DEL_BODY = {
  'entity.parse.failed': 'El cuerpo del pedido no es un JSON válido',
  'entity.too.large': 'El cuerpo del pedido es demasiado grande (máximo 100 KB)',
  'encoding.unsupported': 'La codificación del cuerpo del pedido no está soportada',
  'charset.unsupported': 'El juego de caracteres del cuerpo del pedido no está soportado',
};

// Convierte cualquier error en { error: mensaje }. Express 5 trae hasta acá
// también los errores de los handlers async.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof MethodNotAllowedError) res.set('Allow', err.permitidos.join(', '));
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Los errores del body traen su status (400, 413, 415); se responde con ese y en español.
  if (err.type in ERRORES_DEL_BODY) {
    return res.status(err.status).json({ error: ERRORES_DEL_BODY[err.type] });
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
