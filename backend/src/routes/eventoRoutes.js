import { Router } from 'express';
import * as eventoController from '../controllers/eventoController.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';

const router = Router();

router.get('/', eventoController.list);
router.post('/', requireUsuario, eventoController.create);
// Antes de /:id, para que "organizados" no se tome como un id.
router.get('/organizados', requireUsuario, eventoController.listOrganizados);
router.get('/:id', eventoController.getById);
router.get('/:id/compras', requireUsuario, eventoController.listCompras);

export default router;
