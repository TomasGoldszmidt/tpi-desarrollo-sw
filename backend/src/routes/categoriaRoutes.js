import { Router } from 'express';
import * as categoriaController from '../controllers/categoriaController.js';

const router = Router();

router.get('/', categoriaController.list);

export default router;
