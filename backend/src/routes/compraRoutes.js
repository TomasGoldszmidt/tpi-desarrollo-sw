import { Router } from 'express';
import * as compraController from '../controllers/compraController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';

const router = Router();

// Todas las rutas de compras necesitan saber quién hace el pedido.
router.use(requireUsuario);

router.get('/', compraController.list);
router.post('/', compraController.create);
router.get('/:id', compraController.getById);
router.post('/:id/pago', compraController.pay);
router.post('/:id/utilizacion', compraController.markUtilizada);
router.post('/:id/cancelacion', compraController.cancel);
router.get('/:id/mensajes', compraController.listMensajes);
router.post('/:id/mensajes', compraController.createMensaje);

export default router;
