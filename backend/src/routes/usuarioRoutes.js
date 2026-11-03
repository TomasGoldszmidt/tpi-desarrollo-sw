import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import * as reseniaController from '../controllers/reseniaController.js';

const router = Router();

router.get('/', usuarioController.list);
router.get('/:id/resenias', reseniaController.listByOrganizador);

export default router;
