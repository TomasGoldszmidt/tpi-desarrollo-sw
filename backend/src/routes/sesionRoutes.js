import { Router } from 'express';
import * as sesionController from '../controllers/sesionController.js';
import { methodNotAllowed } from '../http/middlewares/errorHandler.js';

const router = Router();

router.route('/').post(sesionController.create).all(methodNotAllowed);

export default router;
