import { Router } from 'express';
import * as compraController from '../controllers/compraController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';

const router = Router();

// Todas las rutas de compras necesitan saber quién hace el pedido.
router.use(requireUsuario);

router.post('/', compraController.create);
router.post('/:id/pago', compraController.pay);
router.post('/:id/utilizacion', compraController.markUtilizada);
router.post('/:id/cancelacion', compraController.cancel);

export default router;
