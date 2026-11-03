import { Router } from 'express';
import * as reseniaController from '../controllers/reseniaController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';

const router = Router();

router.post('/', requireUsuario, reseniaController.create);

export default router;
