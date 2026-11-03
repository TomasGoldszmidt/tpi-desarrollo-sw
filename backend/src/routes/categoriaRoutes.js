import { Router } from 'express';
import * as categoriaController from '../controllers/categoriaController.js';
import { methodNotAllowed } from '../http/middlewares/errorHandler.js';

const router = Router();

router.route('/').get(categoriaController.list).all(methodNotAllowed);

export default router;
