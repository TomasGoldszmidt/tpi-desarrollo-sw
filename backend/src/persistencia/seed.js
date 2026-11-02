import * as usuarioRepository from './repositorios/usuarioRepository.js';
import * as categoriaRepository from './repositorios/categoriaRepository.js';
import * as eventoRepository from './repositorios/eventoRepository.js';
import * as compraRepository from './repositorios/compraRepository.js';
import * as reseniaRepository from './repositorios/reseniaRepository.js';
import { EstadoCompra } from '../dominio/estadoCompra.js';

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

  // Crea la compra y le aplica los cambios de estado en orden, con fechas coherentes.
  // El total sale del precio del tipo de entrada, no se escribe a mano.
  function comprar({ comprador, evento, tipoEntradaId, cantidad, creada, cambios = [] }) {
    const { precio } = evento.tiposEntrada.find((tipo) => tipo.id === tipoEntradaId);
    let compra = compraRepository.crear({
      compradorId: comprador.id,
      eventoId: evento.id,
      tipoEntradaId,
      cantidad,
      total: precio * cantidad,
      fechaHora: creada,
    });
    for (const [estado, usuario, fechaHora] of cambios) {
      compra = compraRepository.registrarCambioEstado(compra.id, { estado, usuarioId: usuario.id, fechaHora });
    }
    return compra;
  }

  const { sofia, juan, lucia, martin } = usuarios;
  const { CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

  const compras = {
    sofiaRock: comprar({
      comprador: sofia, evento: eventos.rock, tipoEntradaId: 1, cantidad: 2,
      creada: enDias(-5, 14), cambios: [[CONFIRMADA, sofia, enDias(-5, 15)]],
    }),
    sofiaObra: comprar({ // pendiente de pago
      comprador: sofia, evento: eventos.obra, tipoEntradaId: 1, cantidad: 1,
      creada: enDias(-1, 18),
    }),
    juanBackstage: comprar({ // agota el cupo de Backstage (2)
      comprador: juan, evento: eventos.festival, tipoEntradaId: 3, cantidad: 2,
      creada: enDias(-10, 12), cambios: [[CONFIRMADA, juan, enDias(-10, 13)]],
    }),
    juanRockReembolsada: comprar({
      comprador: juan, evento: eventos.rock, tipoEntradaId: 2, cantidad: 1,
      creada: enDias(-8, 10),
      cambios: [[CONFIRMADA, juan, enDias(-8, 11)], [REEMBOLSADA, juan, enDias(-3, 9)]],
    }),
    juanPartidoCancelada: comprar({ // cancelada sin pagar
      comprador: juan, evento: eventos.partido, tipoEntradaId: 1, cantidad: 3,
      creada: enDias(-4, 20), cambios: [[CANCELADA, juan, enDias(-3, 20)]],
    }),
    sofiaAcustico: comprar({ // utilizada: puede reseñar a Lucía
      comprador: sofia, evento: eventos.acustico, tipoEntradaId: 1, cantidad: 1,
      creada: enDias(-40, 15),
      cambios: [[CONFIRMADA, sofia, enDias(-40, 16)], [UTILIZADA, lucia, enDias(-15, 20)]],
    }),
    juanAcustico: comprar({
      comprador: juan, evento: eventos.acustico, tipoEntradaId: 1, cantidad: 2,
      creada: enDias(-35, 11),
      cambios: [[CONFIRMADA, juan, enDias(-35, 12)], [UTILIZADA, lucia, enDias(-15, 20)]],
    }),
    sofiaStandup: comprar({ // utilizada: puede reseñar a Martín
      comprador: sofia, evento: eventos.standup, tipoEntradaId: 1, cantidad: 1,
      creada: enDias(-50, 10),
      cambios: [[CONFIRMADA, sofia, enDias(-50, 11)], [UTILIZADA, martin, enDias(-30, 21)]],
    }),
    juanStandup: comprar({ // confirmada de un evento pasado: no se puede cancelar
      comprador: juan, evento: eventos.standup, tipoEntradaId: 1, cantidad: 1,
      creada: enDias(-45, 17), cambios: [[CONFIRMADA, juan, enDias(-45, 18)]],
    }),
  };

  compraRepository.agregarMensaje(compras.sofiaRock.id, {
    usuarioId: sofia.id, mensaje: '¿Se puede entrar con mochila?', enviado: enDias(-4, 10),
  });
  compras.sofiaRock = compraRepository.agregarMensaje(compras.sofiaRock.id, {
    usuarioId: lucia.id, mensaje: 'Sí, chica, la revisan en la puerta.', enviado: enDias(-4, 11),
  });

  // Sobre las compras utilizadas del acústico: Lucía queda con 4.5 de promedio.
  // Sofía no reseñó el stand-up (para probar crear una) y Martín queda sin reseñas.
  const resenias = {
    sofiaAcustico: reseniaRepository.crear({
      compradorId: sofia.id, eventoId: eventos.acustico.id, puntuacion: 5,
      detalle: 'Sonido impecable y muy buena organización en la entrada.',
    }),
    juanAcustico: reseniaRepository.crear({
      compradorId: juan.id, eventoId: eventos.acustico.id, puntuacion: 4,
      detalle: 'Muy lindo show, aunque empezó media hora tarde.',
    }),
  };

  return { usuarios, categorias, eventos, compras, resenias };
}
