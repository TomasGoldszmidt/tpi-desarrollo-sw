import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController.js';
import * as eventoController from '../controllers/eventoController.js';
import * as reseniaController from '../controllers/reseniaController.js';
import * as favoritoController from '../controllers/favoritoController.js';
import * as notificacionController from '../controllers/notificacionController.js';
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
// Favoritos: privados, solo los ve y los cambia el propio usuario.
router.route('/:id/favoritos').get(requireUsuario, favoritoController.list).all(methodNotAllowed);
router.route('/:id/favoritos/:eventoId')
  .put(requireUsuario, favoritoController.add)
  .delete(requireUsuario, favoritoController.remove)
  .all(methodNotAllowed);
// Notificaciones: se calculan; solo se guarda cuáles se leyeron (todas hasta una fecha o una por una).
router.route('/:id/notificaciones').get(requireUsuario, notificacionController.list).all(methodNotAllowed);
router.route('/:id/notificaciones/lectura').put(requireUsuario, notificacionController.markRead).all(methodNotAllowed);
router.route('/:id/notificaciones/:notificacionId/lectura')
  .put(requireUsuario, notificacionController.markOneRead)
  .all(methodNotAllowed);

export default router;
