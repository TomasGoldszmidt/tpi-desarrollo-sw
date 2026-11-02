import * as usuarioRepositorio from './repositorios/usuarioRepositorio.js';
import * as categoriaRepositorio from './repositorios/categoriaRepositorio.js';

// Carga los datos de ejemplo. Se ejecuta una vez al iniciar el servidor:
// como la persistencia es en memoria, cada reinicio vuelve a este estado.
export function cargarSeed() {
  const usuarios = {
    lucia: usuarioRepositorio.crear({ nombre: 'Lucía', apellido: 'Fernández' }),
    martin: usuarioRepositorio.crear({ nombre: 'Martín', apellido: 'Gómez' }),
    sofia: usuarioRepositorio.crear({ nombre: 'Sofía', apellido: 'Pérez' }),
    juan: usuarioRepositorio.crear({ nombre: 'Juan', apellido: 'Rodríguez' }),
  };

  const categorias = {
    musica: categoriaRepositorio.crear({ nombre: 'Música', descripcion: 'Recitales, conciertos y shows en vivo' }),
    teatro: categoriaRepositorio.crear({ nombre: 'Teatro', descripcion: 'Obras, stand-up y espectáculos' }),
    deportes: categoriaRepositorio.crear({ nombre: 'Deportes', descripcion: 'Partidos y competencias' }),
    festivales: categoriaRepositorio.crear({ nombre: 'Festivales', descripcion: 'Festivales de varios días o artistas' }),
    conferencias: categoriaRepositorio.crear({ nombre: 'Conferencias', descripcion: 'Charlas, congresos y meetups' }),
  };

  return { usuarios, categorias };
}
