import * as usuarioRepository from './repositorios/usuarioRepository.js';
import * as categoriaRepository from './repositorios/categoriaRepository.js';
import * as eventoRepository from './repositorios/eventoRepository.js';

// Fecha relativa al arranque, para que los eventos futuros y pasados no queden viejos.
function enDias(dias, hora = 21) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
}

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

  // Conferencias queda sin eventos, para probar la búsqueda sin resultados.
  const eventos = {
    rock: eventoRepository.crear({
      nombre: 'Noche de Rock Nacional',
      descripcion: 'Las bandas clásicas del rock argentino en un solo escenario',
      lugar: 'Estadio Obras, Av. del Libertador 7395, CABA',
      categoriaId: categorias.musica.id,
      organizadorId: usuarios.lucia.id,
      fecha: enDias(20),
      multimedia: ['https://picsum.photos/seed/rock/800/400'],
      tiposEntrada: [
        { nombre: 'Campo', descripcion: 'De pie, frente al escenario', precio: 45000, cupo: 500 },
        { nombre: 'Platea', descripcion: 'Asiento numerado', precio: 80000, cupo: 200 },
      ],
    }),
    obra: eventoRepository.crear({
      nombre: 'La casa de Bernarda Alba',
      descripcion: 'Clásico de Federico García Lorca con elenco renovado',
      lugar: 'Teatro San Martín, Av. Corrientes 1530, CABA',
      categoriaId: categorias.teatro.id,
      organizadorId: usuarios.lucia.id,
      fecha: enDias(5, 20),
      multimedia: ['https://picsum.photos/seed/bernarda/800/400'],
      tiposEntrada: [
        { nombre: 'Platea', descripcion: 'Filas 1 a 20', precio: 30000, cupo: 150 },
        { nombre: 'Pullman', descripcion: 'Primer piso', precio: 20000, cupo: 80 },
      ],
    }),
    festival: eventoRepository.crear({
      nombre: 'Festival de Verano',
      descripcion: 'Tres días de música, food trucks y artistas invitados',
      lugar: 'Hipódromo de San Isidro, Av. Márquez 504, San Isidro',
      categoriaId: categorias.festivales.id,
      organizadorId: usuarios.lucia.id,
      fecha: enDias(60, 16),
      multimedia: ['https://picsum.photos/seed/festival/800/400', 'https://picsum.photos/seed/festival2/800/400'],
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Acceso a los tres días', precio: 90000, cupo: 1000 },
        { nombre: 'VIP', descripcion: 'Sector preferencial con barra propia', precio: 180000, cupo: 100 },
        // Cupo chico a propósito: el seed de Compra lo va a agotar.
        { nombre: 'Backstage', descripcion: 'Encuentro con los artistas', precio: 350000, cupo: 2 },
      ],
    }),
    acustico: eventoRepository.crear({
      nombre: 'Acústico en el Gran Rex',
      descripcion: 'Show íntimo de canciones a guitarra y voz',
      lugar: 'Teatro Gran Rex, Av. Corrientes 857, CABA',
      categoriaId: categorias.musica.id,
      organizadorId: usuarios.lucia.id,
      fecha: enDias(-15), // pasado: compras utilizadas y reseñas
      multimedia: ['https://picsum.photos/seed/acustico/800/400'],
      tiposEntrada: [
        { nombre: 'Platea', descripcion: 'Planta baja', precio: 35000, cupo: 300 },
      ],
    }),
    partido: eventoRepository.crear({
      nombre: 'Amistoso Estudiantes vs. Gimnasia',
      descripcion: 'Partido amistoso a beneficio',
      lugar: 'Estadio Ciudad de La Plata, Av. 32 y 25, La Plata',
      categoriaId: categorias.deportes.id,
      organizadorId: usuarios.martin.id,
      fecha: enDias(10, 18),
      multimedia: ['https://picsum.photos/seed/partido/800/400'],
      tiposEntrada: [
        { nombre: 'Popular', descripcion: 'Tribuna de pie', precio: 15000, cupo: 2000 },
        { nombre: 'Platea', descripcion: 'Asiento techado', precio: 40000, cupo: 500 },
      ],
    }),
    standup: eventoRepository.crear({
      nombre: 'Noche de Stand-up',
      descripcion: 'Cuatro comediantes, una noche de humor',
      lugar: 'Paseo La Plaza, Av. Corrientes 1660, CABA',
      categoriaId: categorias.teatro.id,
      organizadorId: usuarios.martin.id,
      fecha: enDias(-30, 22), // pasado: reseñas de Martín
      multimedia: [],
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Sin ubicación asignada', precio: 18000, cupo: 120 },
      ],
    }),
  };

  return { usuarios, categorias, eventos };
}
