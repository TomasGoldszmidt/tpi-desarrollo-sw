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

  // Más eventos próximos, para que el catálogo y Mis eventos tengan más de una página.
  // No tienen compras ni reseñas: solo llenan listados.
  const masEventos = [
    ['Tributo a Soda Stereo', 'Una banda tributo repasa los grandes éxitos', 'Teatro Vorterix, Av. Federico Lacroze 3455, CABA', 'musica', 'martin', 3, 21, 25000],
    ['Jazz en el Bebop', 'Cuarteto de jazz con standards y temas propios', 'Bebop Club, Moreno 364, CABA', 'musica', 'lucia', 7, 22, 12000],
    ['Final del Torneo de Vóley', 'La final del torneo metropolitano', 'Estadio Obras, Av. del Libertador 7395, CABA', 'deportes', 'martin', 8, 19, 8000],
    ['Hamlet', 'La tragedia de Shakespeare en versión moderna', 'Teatro Cervantes, Libertad 815, CABA', 'teatro', 'lucia', 12, 20, 22000],
    ['Orquesta Sinfónica Nacional', 'Beethoven y Brahms en el Centro Cultural', 'Centro Cultural Kirchner, Sarmiento 151, CABA', 'musica', 'lucia', 14, 20, 10000],
    ['Maratón de Stand-up', 'Diez comediantes, una noche larga', 'Teatro Picadero, Pje. Santos Discépolo 1857, CABA', 'teatro', 'martin', 15, 21, 16000],
    ['Clásico de Básquet', 'Boca y San Lorenzo por la Liga Nacional', 'Estadio Luis Conde, Arzobispo Espinosa 600, CABA', 'deportes', 'martin', 17, 20, 14000],
    ['Cumbia en el Konex', 'Una noche para bailar con bandas en vivo', 'Ciudad Cultural Konex, Sarmiento 3131, CABA', 'musica', 'lucia', 22, 23, 18000],
    ['El principito', 'Obra para toda la familia', 'Teatro Astral, Av. Corrientes 1639, CABA', 'teatro', 'lucia', 25, 17, 15000],
    ['Festival de Food Trucks y Música', 'Dos días de comida y bandas emergentes', 'Parque de la Ciudad, Av. Escalada 4501, CABA', 'festivales', 'martin', 30, 14, 9000],
    ['Tango en la Usina', 'Orquesta típica y bailarines invitados', 'Usina del Arte, Agustín R. Caffarena 1, CABA', 'musica', 'lucia', 35, 20, 13000],
    ['Copa de Rugby Juvenil', 'Los mejores equipos juveniles del país', 'CASI, Roque Sáenz Peña 499, San Isidro', 'deportes', 'martin', 40, 15, 6000],
    ['Improvisación teatral', 'Una obra distinta cada noche, armada con el público', 'Teatro La Comedia, Rodríguez Peña 1062, CABA', 'teatro', 'martin', 45, 21, 11000],
    ['Festival Electrónico', 'Una noche con DJs nacionales e internacionales', 'Costanera Sur, Av. Tristán Achával Rodríguez, CABA', 'festivales', 'lucia', 75, 22, 55000],
  ];
  const eventosNuevos = {};
  for (const [nombre, descripcion, lugar, categoria, organizador, dias, hora, precio] of masEventos) {
    eventosNuevos[nombre] = eventoRepository.create({
      nombre,
      descripcion,
      lugar,
      categoriaId: categorias[categoria].id,
      organizadorId: usuarios[organizador].id,
      fecha: daysFromNow(dias, hora),
      multimedia: [`https://picsum.photos/seed/evento${dias}/800/400`],
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Sin ubicación asignada', precio, cupo: 300 },
        { nombre: 'Preferencial', descripcion: 'Mejor ubicación', precio: precio * 2, cupo: 100 },
      ],
    });
  }

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

  // Hasta dónde leyó cada uno: quien escribe ya leyó su chat. Sofía no abrió la respuesta de
  // Lucía y Lucía no abrió las preguntas de Juan, así que esos chats tienen mensajes nuevos.
  compraRepository.marcarMensajesLeidos(compras.sofiaRock.id, 'comprador', daysFromNow(-4, 10));
  compras.sofiaRock = compraRepository.marcarMensajesLeidos(compras.sofiaRock.id, 'organizador', daysFromNow(-4, 11));
  compras.juanRockReembolsada = compraRepository.marcarMensajesLeidos(compras.juanRockReembolsada.id, 'comprador', daysFromNow(-3, 10));
  compras.juanBackstage = compraRepository.marcarMensajesLeidos(compras.juanBackstage.id, 'comprador', daysFromNow(-1, 19));

  // Más compras de Sofía, para que Mis compras tenga más de una página (14 en total).
  // Son de hace más de 4 días: no suman notificaciones nuevas para Lucía ni Martín.
  const masComprasDeSofia = [
    ['Hamlet', 1, -9, []],
    ['El principito', 2, -7, []],
    ['Jazz en el Bebop', 1, -12, [[CONFIRMADA, sofia, 0]]],
    ['Tango en la Usina', 2, -15, [[CONFIRMADA, sofia, 0]]],
    ['Final del Torneo de Vóley', 1, -20, [[CANCELADA, sofia, 1]]],
    ['Cumbia en el Konex', 2, -18, [[CANCELADA, sofia, 2]]],
  ];
  for (const [nombre, cantidad, dias, cambios] of masComprasDeSofia) {
    createCompra({
      comprador: sofia, evento: eventosNuevos[nombre], tipoEntradaId: 1, cantidad,
      creada: daysFromNow(dias, 12),
      cambios: cambios.map(([estado, usuario, despues]) => [estado, usuario, daysFromNow(dias + despues, 13)]),
    });
  }

  // Más ventas de Noche de Rock Nacional (de Martín y Juan), para que Ventas de ese evento
  // tenga más de una página (13 en total). Son de hace más de 4 días: no suman
  // notificaciones nuevas para Lucía.
  const masVentasDelRock = [
    [martin, 1, 2, -30, []],
    [martin, 2, 1, -28, [[CONFIRMADA, 0]]],
    [juan, 1, 4, -26, [[CONFIRMADA, 0]]],
    [martin, 1, 1, -24, [[CANCELADA, 1]]],
    [juan, 2, 2, -22, [[CONFIRMADA, 0], [REEMBOLSADA, 3]]],
    [martin, 1, 3, -20, [[CONFIRMADA, 0]]],
    [juan, 1, 1, -18, []],
    [martin, 2, 2, -16, [[CONFIRMADA, 0]]],
    [juan, 1, 2, -14, [[CANCELADA, 2]]],
    [martin, 1, 1, -12, [[CONFIRMADA, 0]]],
    [juan, 1, 3, -10, [[CONFIRMADA, 0]]],
  ];
  for (const [comprador, tipoEntradaId, cantidad, dias, cambios] of masVentasDelRock) {
    createCompra({
      comprador, evento: eventos.rock, tipoEntradaId, cantidad,
      creada: daysFromNow(dias, 11),
      cambios: cambios.map(([estado, despues]) => [estado, comprador, daysFromNow(dias + despues, 12)]),
    });
  }

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

  // Eventos viejos de Lucía con una compra utilizada y una reseña de Sofía, Juan y Martín
  // en cada uno, para que sus reseñas tengan más de una página (14 en total). Son anteriores
  // a la lectura de notificaciones, así que no aparecen como nuevas. Lucía sigue con 4.5.
  const eventosViejos = [
    ['Recital de Cuarteto', 'Una noche de cuarteto cordobés en Buenos Aires', 'Teatro Ópera, Av. Corrientes 860, CABA', 'musica', -60, 30000, [
      [sofia, 5, 'La banda sonó perfecto y se bailó toda la noche.'],
      [juan, 4, 'Muy bueno, pero hacía mucho calor adentro.'],
      [martin, 5, 'De lo mejor que vi este año.'],
    ]],
    ['Esperando a Godot', 'La obra de Beckett con dirección nueva', 'Teatro Regio, Av. Córdoba 6056, CABA', 'teatro', -75, 20000, [
      [sofia, 4, 'Gran actuación, aunque se hace un poco larga.'],
      [juan, 5, 'Los actores, impecables.'],
      [martin, 4, 'Muy buena, las butacas algo incómodas.'],
    ]],
    ['Festival de Otoño', 'Un día de bandas independientes al aire libre', 'Parque Centenario, Av. Díaz Vélez 4800, CABA', 'festivales', -95, 25000, [
      [sofia, 5, 'Excelente organización y mucha variedad de comida.'],
      [juan, 4, 'Las filas para entrar eran largas.'],
      [martin, 5, 'Volvería sin dudarlo.'],
    ]],
    ['Charla de Producción de Eventos', 'Cómo se organiza un show de punta a punta', 'Centro Cultural Recoleta, Junín 1930, CABA', 'conferencias', -115, 5000, [
      [sofia, 4, 'Muy útil, me faltó tiempo para preguntas.'],
      [juan, 5, 'Aprendí un montón.'],
      [martin, 4, 'Interesante, el sonido de la sala no ayudaba.'],
    ]],
  ];
  for (const [nombre, descripcion, lugar, categoria, dias, precio, reseniasDelEvento] of eventosViejos) {
    const evento = eventoRepository.create({
      nombre,
      descripcion,
      lugar,
      categoriaId: categorias[categoria].id,
      organizadorId: lucia.id,
      fecha: daysFromNow(dias, 20),
      multimedia: [`https://picsum.photos/seed/viejo${-dias}/800/400`],
      tiposEntrada: [{ nombre: 'General', descripcion: 'Sin ubicación asignada', precio, cupo: 200 }],
    });
    reseniasDelEvento.forEach(([comprador, puntuacion, detalle], i) => {
      createCompra({
        comprador, evento, tipoEntradaId: 1, cantidad: 1,
        creada: daysFromNow(dias - 20 + i, 12),
        cambios: [[CONFIRMADA, comprador, daysFromNow(dias - 20 + i, 13)], [UTILIZADA, lucia, daysFromNow(dias, 20)]],
      });
      reseniaRepository.create({
        compradorId: comprador.id, eventoId: evento.id, puntuacion, detalle, fecha: daysFromNow(dias + 1 + i, 12),
      });
    });
  }

  return { usuarios, categorias, eventos, compras, resenias };
}
