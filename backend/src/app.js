import { readFileSync } from 'node:fs';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { notFound, errorHandler, methodNotAllowed } from './http/middlewares/errorHandler.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import eventoRoutes from './routes/eventoRoutes.js';
import compraRoutes from './routes/compraRoutes.js';
import reseniaRoutes from './routes/reseniaRoutes.js';
import sesionRoutes from './routes/sesionRoutes.js';

const openapi = YAML.parse(readFileSync(new URL('./docs/openapi.yaml', import.meta.url), 'utf8'));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.route('/health')
    .get((req, res) => res.json({ status: 'ok' }))
    .all(methodNotAllowed);

  // Las rutas de cada recurso se montan acá, antes del manejo de errores.
  app.use('/usuarios', usuarioRoutes);
  app.use('/categorias', categoriaRoutes);
  app.use('/eventos', eventoRoutes);
  app.use('/compras', compraRoutes);
  app.use('/resenias', reseniaRoutes);
  app.use('/sesiones', sesionRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
