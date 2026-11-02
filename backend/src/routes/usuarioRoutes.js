import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';

const router = Router();

router.get('/', usuarioController.list);

export default router;
