import { Router } from 'express';
import * as compraController from '../controllers/compraController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';
import { methodNotAllowed } from '../http/middlewares/errorHandler.js';

const router = Router();

// Todas las rutas de compras necesitan saber quién hace el pedido. Va en cada ruta
// (y no con router.use) para que una URL inexistente siga dando 404 y no 401.
router.route('/')
  .get(requireUsuario, compraController.list)
  .post(requireUsuario, compraController.create)
  .all(methodNotAllowed);
router.route('/:id').get(requireUsuario, compraController.getById).all(methodNotAllowed);
router.route('/:id/pago').post(requireUsuario, compraController.pay).all(methodNotAllowed);
router.route('/:id/utilizacion').post(requireUsuario, compraController.markUtilizada).all(methodNotAllowed);
router.route('/:id/cancelacion').post(requireUsuario, compraController.cancel).all(methodNotAllowed);
router.route('/:id/mensajes')
  .get(requireUsuario, compraController.listMensajes)
  .post(requireUsuario, compraController.createMensaje)
  .all(methodNotAllowed);
router.route('/:id/mensajes/lectura').put(requireUsuario, compraController.markMensajesRead).all(methodNotAllowed);

export default router;
