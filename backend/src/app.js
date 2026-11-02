import { readFileSync } from 'node:fs';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

const openapi = YAML.parse(readFileSync(new URL('./docs/openapi.yaml', import.meta.url), 'utf8'));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
