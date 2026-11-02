import { createApp } from './app.js';
import { loadSeed } from './persistence/seed.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const seed = loadSeed();
const summary = Object.entries(seed)
  .map(([collection, documents]) => `${Object.keys(documents).length} ${collection}`)
  .join(', ');
console.log(`Seed cargado: ${summary}`);

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
