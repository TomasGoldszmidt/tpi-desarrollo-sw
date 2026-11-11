import * as usuarioRepository from './repositories/usuarioRepository.js';
import { registrar } from '../domain/cuenta.js';
import * as categoriaRepository from './repositories/categoriaRepository.js';
import * as eventoRepository from './repositories/eventoRepository.js';
import * as compraRepository from './repositories/compraRepository.js';
import * as reseniaRepository from './repositories/reseniaRepository.js';
import { EstadoCompra } from '../domain/estadoCompra.js';

// Fecha relativa al arranque, para que los eventos futuros y pasados no queden viejos.
function daysFromNow(days, hour = 21) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Carga los datos de ejemplo. Se ejecuta una vez al iniciar el servidor:
// como la persistencia es en memoria, cada reinicio vuelve a este estado.
export function loadSeed() {
  // Cuentas de prueba: el email es <nombre>@aiticketit.com y la contraseña <nombre>1234 (sin tildes).
  const usuarios = {
    lucia: registrar({ nombre: 'Lucía', apellido: 'Fernández', email: 'lucia@aiticketit.com', contrasenia: 'lucia1234' }),
    martin: registrar({ nombre: 'Martín', apellido: 'Gómez', email: 'martin@aiticketit.com', contrasenia: 'martin1234' }),
    sofia: registrar({ nombre: 'Sofía', apellido: 'Pérez', email: 'sofia@aiticketit.com', contrasenia: 'sofia1234' }),
    juan: registrar({ nombre: 'Juan', apellido: 'Rodríguez', email: 'juan@aiticketit.com', contrasenia: 'juan1234' }),
  };

  const categorias = {
    musica: categoriaRepository.create({ nombre: 'Música', descripcion: 'Recitales, conciertos y shows en vivo' }),
    teatro: categoriaRepository.create({ nombre: 'Teatro', descripcion: 'Obras, stand-up y espectáculos' }),
    deportes: categoriaRepository.create({ nombre: 'Deportes', descripcion: 'Partidos y competencias' }),
    festivales: categoriaRepository.create({ nombre: 'Festivales', descripcion: 'Festivales de varios días o artistas' }),
    conferencias: categoriaRepository.create({ nombre: 'Conferencias', descripcion: 'Charlas, congresos y meetups' }),
  };

  // Conferencias queda sin eventos, para probar la búsqueda sin resultados.
  const eventos = {
    rock: eventoRepository.create({
      nombre: 'Noche de Rock Nacional',
      descripcion: 'Las bandas clásicas del rock argentino en un solo escenario',
      lugar: 'Estadio Obras, Av. del Libertador 7395, CABA',
      categoriaId: categorias.musica.id,
      organizadorId: usuarios.lucia.id,
      fecha: daysFromNow(20),
      multimedia: ['https://picsum.photos/seed/rock/800/400'],
      tiposEntrada: [
        { nombre: 'Campo', descripcion: 'De pie, frente al escenario', precio: 45000, cupo: 500 },
        { nombre: 'Platea', descripcion: 'Asiento numerado', precio: 80000, cupo: 200 },
      ],
    }),
    obra: eventoRepository.create({
      nombre: 'La casa de Bernarda Alba',
      descripcion: 'Clásico de Federico García Lorca con elenco renovado',
      lugar: 'Teatro San Martín, Av. Corrientes 1530, CABA',
      categoriaId: categorias.teatro.id,
      organizadorId: usuarios.lucia.id,
      fecha: daysFromNow(5, 20),
      multimedia: ['https://picsum.photos/seed/bernarda/800/400'],
      tiposEntrada: [
        { nombre: 'Platea', descripcion: 'Filas 1 a 20', precio: 30000, cupo: 150 },
        { nombre: 'Pullman', descripcion: 'Primer piso', precio: 20000, cupo: 80 },
      ],
    }),
    festival: eventoRepository.create({
      nombre: 'Festival de Verano',
      descripcion: 'Tres días de música, food trucks y artistas invitados',
      lugar: 'Hipódromo de San Isidro, Av. Márquez 504, San Isidro',
      categoriaId: categorias.festivales.id,
      organizadorId: usuarios.lucia.id,
      fecha: daysFromNow(60, 16),
      multimedia: ['https://picsum.photos/seed/festival/800/400', 'https://picsum.photos/seed/festival2/800/400'],
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Acceso a los tres días', precio: 90000, cupo: 1000 },
        { nombre: 'VIP', descripcion: 'Sector preferencial con barra propia', precio: 180000, cupo: 100 },
        // Cupo chico a propósito: el seed de Compra lo va a agotar.
        { nombre: 'Backstage', descripcion: 'Encuentro con los artistas', precio: 350000, cupo: 2 },
      ],
    }),
    acustico: eventoRepository.create({
      nombre: 'Acústico en el Gran Rex',
      descripcion: 'Show íntimo de canciones a guitarra y voz',
      lugar: 'Teatro Gran Rex, Av. Corrientes 857, CABA',
      categoriaId: categorias.musica.id,
      organizadorId: usuarios.lucia.id,
      fecha: daysFromNow(-15), // pasado: compras utilizadas y reseñas
      multimedia: ['https://picsum.photos/seed/acustico/800/400'],
      tiposEntrada: [
        { nombre: 'Platea', descripcion: 'Planta baja', precio: 35000, cupo: 300 },
      ],
    }),
    partido: eventoRepository.create({
      nombre: 'Amistoso Estudiantes vs. Gimnasia',
      descripcion: 'Partido amistoso a beneficio',
      lugar: 'Estadio Ciudad de La Plata, Av. 32 y 25, La Plata',
      categoriaId: categorias.deportes.id,
      organizadorId: usuarios.martin.id,
      fecha: daysFromNow(10, 18),
      multimedia: ['https://picsum.photos/seed/partido/800/400'],
      tiposEntrada: [
        { nombre: 'Popular', descripcion: 'Tribuna de pie', precio: 15000, cupo: 2000 },
        { nombre: 'Platea', descripcion: 'Asiento techado', precio: 40000, cupo: 500 },
      ],
    }),
    standup: eventoRepository.create({
      nombre: 'Noche de Stand-up',
      descripcion: 'Cuatro comediantes, una noche de humor',
      lugar: 'Paseo La Plaza, Av. Corrientes 1660, CABA',
      categoriaId: categorias.teatro.id,
      organizadorId: usuarios.martin.id,
      fecha: daysFromNow(-30, 22), // pasado: reseñas de Martín
      multimedia: [],
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Sin ubicación asignada', precio: 18000, cupo: 120 },
      ],
    }),
  };

  // Favoritos de Sofía: dos eventos próximos y uno ya realizado. Los demás no tienen.
  for (const evento of [eventos.partido, eventos.festival, eventos.acustico]) {
    usuarioRepository.addFavorito(usuarios.sofia.id, evento.id);
  }

  // Crea la compra y le aplica los cambios de estado en orden, con fechas coherentes.
  // El total sale del precio del tipo de entrada, no se escribe a mano.
  function createCompra({ comprador, evento, tipoEntradaId, cantidad, creada, cambios = [] }) {
    const { precio } = evento.tiposEntrada.find((tipo) => tipo.id === tipoEntradaId);
    let compra = compraRepository.create({
      compradorId: comprador.id,
      eventoId: evento.id,
      tipoEntradaId,
      cantidad,
      total: precio * cantidad,
      fechaHora: creada,
    });
    for (const [estado, usuario, fechaHora] of cambios) {
      compra = compraRepository.addCambioEstado(compra.id, { estado, usuarioId: usuario.id, fechaHora });
    }
    return compra;
  }

  const { sofia, juan, lucia, martin } = usuarios;
  const { CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

  const compras = {
    sofiaRock: createCompra({
      comprador: sofia, evento: eventos.rock, tipoEntradaId: 1, cantidad: 2,
      creada: daysFromNow(-5, 14), cambios: [[CONFIRMADA, sofia, daysFromNow(-5, 15)]],
    }),
    sofiaObra: createCompra({ // pendiente de pago
      comprador: sofia, evento: eventos.obra, tipoEntradaId: 1, cantidad: 1,
      creada: daysFromNow(-1, 18),
    }),
    juanBackstage: createCompra({ // agota el cupo de Backstage (2)
      comprador: juan, evento: eventos.festival, tipoEntradaId: 3, cantidad: 2,
      creada: daysFromNow(-10, 12), cambios: [[CONFIRMADA, juan, daysFromNow(-10, 13)]],
    }),
    juanRockReembolsada: createCompra({
      comprador: juan, evento: eventos.rock, tipoEntradaId: 2, cantidad: 1,
      creada: daysFromNow(-8, 10),
      cambios: [[CONFIRMADA, juan, daysFromNow(-8, 11)], [REEMBOLSADA, juan, daysFromNow(-3, 9)]],
    }),
    juanPartidoCancelada: createCompra({ // cancelada sin pagar
      comprador: juan, evento: eventos.partido, tipoEntradaId: 1, cantidad: 3,
      creada: daysFromNow(-4, 20), cambios: [[CANCELADA, juan, daysFromNow(-3, 20)]],
    }),
    sofiaAcustico: createCompra({ // utilizada: puede reseñar a Lucía
      comprador: sofia, evento: eventos.acustico, tipoEntradaId: 1, cantidad: 1,
      creada: daysFromNow(-40, 15),
      cambios: [[CONFIRMADA, sofia, daysFromNow(-40, 16)], [UTILIZADA, lucia, daysFromNow(-15, 20)]],
    }),
    juanAcustico: createCompra({
      comprador: juan, evento: eventos.acustico, tipoEntradaId: 1, cantidad: 2,
      creada: daysFromNow(-35, 11),
      cambios: [[CONFIRMADA, juan, daysFromNow(-35, 12)], [UTILIZADA, lucia, daysFromNow(-15, 20)]],
    }),
    sofiaStandup: createCompra({ // utilizada: puede reseñar a Martín
      comprador: sofia, evento: eventos.standup, tipoEntradaId: 1, cantidad: 1,
      creada: daysFromNow(-50, 10),
      cambios: [[CONFIRMADA, sofia, daysFromNow(-50, 11)], [UTILIZADA, martin, daysFromNow(-30, 21)]],
    }),
    juanStandup: createCompra({ // confirmada de un evento pasado: no se puede cancelar
      comprador: juan, evento: eventos.standup, tipoEntradaId: 1, cantidad: 1,
      creada: daysFromNow(-45, 17), cambios: [[CONFIRMADA, juan, daysFromNow(-45, 18)]],
    }),
  };

  compraRepository.addMensaje(compras.sofiaRock.id, {
    usuarioId: sofia.id, mensaje: '¿Se puede entrar con mochila?', enviado: daysFromNow(-4, 10),
  });
  compras.sofiaRock = compraRepository.addMensaje(compras.sofiaRock.id, {
    usuarioId: lucia.id, mensaje: 'Sí, chica, la revisan en la puerta.', enviado: daysFromNow(-4, 11),
  });
  // Dos preguntas de Juan que Lucía todavía no respondió: aparecen en sus mensajes y notificaciones.
  compras.juanRockReembolsada = compraRepository.addMensaje(compras.juanRockReembolsada.id, {
    usuarioId: juan.id, mensaje: '¿En cuántos días me llega el reembolso?', enviado: daysFromNow(-3, 10),
  });
  compras.juanBackstage = compraRepository.addMensaje(compras.juanBackstage.id, {
    usuarioId: juan.id, mensaje: '¿El Backstage incluye estacionamiento?', enviado: daysFromNow(-1, 19),
  });

  // Todos leyeron sus notificaciones hace unos días: lo posterior aparece como nuevo
  // (Lucía tiene 4, Martín 2, Sofía 1 y Juan ninguna).
  for (const usuario of Object.values(usuarios)) {
    usuarioRepository.marcarNotificacionesLeidas(usuario.id, daysFromNow(-4, 10));
  }

  // Sobre las compras utilizadas del acústico: Lucía queda con 4.5 de promedio.
  // Sofía no reseñó el stand-up (para probar crear una) y Martín queda sin reseñas.
  const resenias = {
    sofiaAcustico: reseniaRepository.create({
      compradorId: sofia.id, eventoId: eventos.acustico.id, puntuacion: 5, fecha: daysFromNow(-14, 12),
      detalle: 'Sonido impecable y muy buena organización en la entrada.',
    }),
    juanAcustico: reseniaRepository.create({
      compradorId: juan.id, eventoId: eventos.acustico.id, puntuacion: 4, fecha: daysFromNow(-13, 18),
      detalle: 'Muy lindo show, aunque empezó media hora tarde.',
    }),
  };

  return { usuarios, categorias, eventos, compras, resenias };
}
