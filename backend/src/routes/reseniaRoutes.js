import { Router } from 'express';
import * as reseniaController from '../controllers/reseniaController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';
import { methodNotAllowed } from '../http/middlewares/errorHandler.js';

const router = Router();

router.route('/').post(requireUsuario, reseniaController.create).all(methodNotAllowed);

export default router;
