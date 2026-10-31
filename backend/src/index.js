import { crearApp } from './app.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const app = crearApp();

app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});
