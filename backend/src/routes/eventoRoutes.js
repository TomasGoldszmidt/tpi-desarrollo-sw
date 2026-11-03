import { Router } from 'express';
import * as eventoController from '../controllers/eventoController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';

const router = Router();

router.get('/', eventoController.list);
router.post('/', requireUsuario, eventoController.create);
router.get('/:id', eventoController.getById);

export default router;
