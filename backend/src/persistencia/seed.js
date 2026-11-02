import * as usuarioRepositorio from './repositorios/usuarioRepositorio.js';

// Carga los datos de ejemplo. Se ejecuta una vez al iniciar el servidor:
// como la persistencia es en memoria, cada reinicio vuelve a este estado.
export function cargarSeed() {
  const usuarios = {
    lucia: usuarioRepositorio.crear({ nombre: 'Lucía', apellido: 'Fernández' }),
    martin: usuarioRepositorio.crear({ nombre: 'Martín', apellido: 'Gómez' }),
    sofia: usuarioRepositorio.crear({ nombre: 'Sofía', apellido: 'Pérez' }),
    juan: usuarioRepositorio.crear({ nombre: 'Juan', apellido: 'Rodríguez' }),
  };

  return { usuarios };
}
