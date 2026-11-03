import { Router } from 'express';
import * as eventoController from '../controllers/eventoController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';
import { methodNotAllowed } from '../http/middlewares/errorHandler.js';

const router = Router();

router.route('/')
  .get(eventoController.list)
  .post(requireUsuario, eventoController.create)
  .all(methodNotAllowed);
router.route('/:id').get(eventoController.getById).all(methodNotAllowed);
router.route('/:id/compras').get(requireUsuario, eventoController.listCompras).all(methodNotAllowed);

export default router;
