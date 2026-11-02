import { crearApp } from './app.js';
import { cargarSeed } from './persistencia/seed.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const seed = cargarSeed();
const resumen = Object.entries(seed)
  .map(([coleccion, documentos]) => `${Object.keys(documentos).length} ${coleccion}`)
  .join(', ');
console.log(`Seed cargado: ${resumen}`);

const app = crearApp();

app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
