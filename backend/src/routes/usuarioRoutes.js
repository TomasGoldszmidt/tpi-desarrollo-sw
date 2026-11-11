import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import * as eventoController from '../controllers/eventoController.js';
import * as reseniaController from '../controllers/reseniaController.js';
import { methodNotAllowed } from '../http/middlewares/errorHandler.js';
import { requireUsuario } from '../http/middlewares/requireUsuario.js';

const router = Router();

router.route('/').get(usuarioController.list).post(usuarioController.create).all(methodNotAllowed);
router.route('/:id')
  .get(usuarioController.getById)
  .patch(requireUsuario, usuarioController.update)
  .all(methodNotAllowed);
// Lo que un usuario tiene como organizador: sus eventos y las reseñas que recibió.
router.route('/:id/eventos').get(eventoController.listByOrganizador).all(methodNotAllowed);
router.route('/:id/resenias').get(reseniaController.listByOrganizador).all(methodNotAllowed);

export default router;
