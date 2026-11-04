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

// En Express 5, si no puede escuchar (ej: el puerto ya está ocupado por otro backend),
// el error llega a este callback en lugar de tirarse. Sin revisarlo, se imprimía
// "Servidor escuchando" y el proceso terminaba sin avisar.
app.listen(PORT, HOST, (error) => {
  if (error) {
    const motivo = error.code === 'EADDRINUSE'
      ? `El puerto ${PORT} ya está en uso: cerrá el otro backend y volvé a intentar`
      : error.message;
    console.error(`No se pudo levantar el servidor. ${motivo}`);
    process.exit(1);
  }
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
