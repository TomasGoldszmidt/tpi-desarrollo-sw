import { crearApp } from './app.js';
import { cargarSeed } from './persistencia/seed.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const seed = cargarSeed();
console.log(`Seed cargado: ${Object.keys(seed.usuarios).length} usuarios`);

const app = crearApp();

app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
