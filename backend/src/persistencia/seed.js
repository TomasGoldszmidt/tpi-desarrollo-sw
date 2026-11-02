import * as usuarioRepository from './repositorios/usuarioRepository.js';
import * as categoriaRepository from './repositorios/categoriaRepository.js';

// Carga los datos de ejemplo. Se ejecuta una vez al iniciar el servidor:
// como la persistencia es en memoria, cada reinicio vuelve a este estado.
export function cargarSeed() {
  const usuarios = {
    lucia: usuarioRepository.crear({ nombre: 'Lucía', apellido: 'Fernández' }),
    martin: usuarioRepository.crear({ nombre: 'Martín', apellido: 'Gómez' }),
    sofia: usuarioRepository.crear({ nombre: 'Sofía', apellido: 'Pérez' }),
    juan: usuarioRepository.crear({ nombre: 'Juan', apellido: 'Rodríguez' }),
  };

  const categorias = {
    musica: categoriaRepository.crear({ nombre: 'Música', descripcion: 'Recitales, conciertos y shows en vivo' }),
    teatro: categoriaRepository.crear({ nombre: 'Teatro', descripcion: 'Obras, stand-up y espectáculos' }),
    deportes: categoriaRepository.crear({ nombre: 'Deportes', descripcion: 'Partidos y competencias' }),
    festivales: categoriaRepository.crear({ nombre: 'Festivales', descripcion: 'Festivales de varios días o artistas' }),
    conferencias: categoriaRepository.crear({ nombre: 'Conferencias', descripcion: 'Charlas, congresos y meetups' }),
  };

  return { usuarios, categorias };
}
