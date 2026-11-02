import { readFileSync } from 'node:fs';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { notFound, errorHandler } from './http/middlewares/errorHandler.js';

const openapi = YAML.parse(readFileSync(new URL('./docs/openapi.yaml', import.meta.url), 'utf8'));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Las rutas de cada recurso se montan acá, antes del manejo de errores.

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
