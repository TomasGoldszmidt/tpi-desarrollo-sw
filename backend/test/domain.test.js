import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import { calcularDisponibles, hayCupoPara } from '../src/domain/tipoEntrada.js';
import {
  tuPrecioEstaEntre, crearEvento, detalleEvento, buscarEventos, precioDesde, eventosOrganizados, verificarOrganizador,
  filtroOrganizador, cantidadesOrganizador,
} from '../src/domain/evento.js';
import { calcularPuntajes, crearResenia, perfilUsuario, puntajeDe, reseniaDeCompra, reseniasDeOrganizador } from '../src/domain/resenia.js';
import * as reseniaRepository from '../src/persistence/repositories/reseniaRepository.js';
import * as eventoRepository from '../src/persistence/repositories/eventoRepository.js';
import {
  actualizarEstado, estadoAlCancelar, comprar, detalleCompra, diasRestantes, puedeVer, masRecientesPrimero, enviarMensaje, mensajesConAutor,
  ordenarPorImportancia, cantidadesPorEstado,
  mensajesNoLeidos, cantidadConMensajesNoLeidos, leerMensajes, rolEnCompra, conversaciones,
} from '../src/domain/compra.js';
import { requireString } from '../src/http/validation.js';
import { EstadoCompra } from '../src/domain/estadoCompra.js';
import { BusinessRuleError, ForbiddenError } from '../src/http/errors.js';

// Se usa el seed real: los casos borde (Backstage agotado, compras canceladas) ya están ahí.
const seed = loadSeed();

function tipo(evento, nombre) {
  return evento.tiposEntrada.find((t) => t.nombre === nombre);
}

describe('cupo disponible', () => {
  const { festival, rock, obra } = seed.eventos;

  it('descuenta las compras CONFIRMADAS: Backstage queda agotado', () => {
    const compras = compraRepository.findByEvento(festival.id);
    assert.equal(calcularDisponibles(tipo(festival, 'Backstage'), compras), 0);
  });

  it('una PENDIENTE también ocupa cupo', () => {
    const compras = compraRepository.findByEvento(obra.id);
    assert.equal(calcularDisponibles(tipo(obra, 'Platea'), compras), 149);
  });

  // Solo las dos compras del Rock que importan acá (el seed le suma más ventas en otros estados).
  const comprasDelRock = () => [seed.compras.paredesRock, seed.compras.blancoRockReembolsada];

  it('una REEMBOLSADA libera el cupo', () => {
    const compras = comprasDelRock();
    assert.equal(calcularDisponibles(tipo(rock, 'Platea'), compras), 200);
  });

  it('solo cuenta las compras de ese tipo de entrada', () => {
    const compras = comprasDelRock();
    assert.equal(calcularDisponibles(tipo(rock, 'Campo'), compras), 498);
  });

  it('hayCupoPara compara la cantidad pedida con las disponibles', () => {
    const compras = compraRepository.findByEvento(festival.id);
    assert.equal(hayCupoPara(tipo(festival, 'Backstage'), compras, 1), false);
    assert.equal(hayCupoPara(tipo(festival, 'VIP'), compras, 100), true);
    assert.equal(hayCupoPara(tipo(festival, 'VIP'), compras, 101), false);
  });
});

describe('tuPrecioEstaEntre', () => {
  const { rock } = seed.eventos; // Campo 45.000 y Platea 80.000

  it('alcanza con que un tipo de entrada esté en el rango', () => {
    assert.equal(tuPrecioEstaEntre(rock, 50000, 100000), true);
  });

  it('incluye los extremos', () => {
    assert.equal(tuPrecioEstaEntre(rock, 80000, 90000), true);
    assert.equal(tuPrecioEstaEntre(rock, 10000, 45000), true);
  });

  it('es falso si ningún precio cae en el rango', () => {
    assert.equal(tuPrecioEstaEntre(rock, 50000, 70000), false);
  });

  it('cualquiera de los límites puede faltar', () => {
    assert.equal(tuPrecioEstaEntre(rock, 80000), true);
    assert.equal(tuPrecioEstaEntre(rock, 80001), false);
    assert.equal(tuPrecioEstaEntre(rock, undefined, 44999), false);
    assert.equal(tuPrecioEstaEntre(rock), true);
  });
});

describe('transiciones de estado', () => {
  const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;
  const { paredes, blanco, dilollo } = seed.usuarios;
  const { partido, standup, rock } = seed.eventos;

  // Las compras que se modifican se crean acá, en el partido (futuro, de Dilollo),
  // para no tocar las del seed que usan los tests de cupo.
  function compraPendiente(comprador = paredes, evento = partido) {
    return compraRepository.create({ compradorId: comprador.id, eventoId: evento.id, tipoEntradaId: 1, cantidad: 1, total: 15000 });
  }

  function rechaza(fn, Clase, mensaje) {
    assert.throws(fn, (err) => err instanceof Clase && err.message === mensaje);
  }

  it('pagar: PENDIENTE → CONFIRMADA y suma el cambio al historial', () => {
    const ahora = new Date();
    const compra = actualizarEstado(compraPendiente(), partido, CONFIRMADA, paredes, ahora);
    assert.equal(compra.estado, CONFIRMADA);
    assert.deepEqual(compra.historial.map((c) => c.estado), [PENDIENTE, CONFIRMADA]);
    assert.deepEqual(compra.historial.at(-1), { estado: CONFIRMADA, usuarioId: paredes.id, fechaHora: ahora });
    assert.equal(compraRepository.findById(compra.id).estado, CONFIRMADA);
  });

  it('cancelar una PENDIENTE la deja CANCELADA', () => {
    const pendiente = compraPendiente();
    const compra = actualizarEstado(pendiente, partido, estadoAlCancelar(pendiente), paredes);
    assert.equal(compra.estado, CANCELADA);
  });

  it('cancelar una CONFIRMADA la deja REEMBOLSADA', () => {
    const confirmada = actualizarEstado(compraPendiente(), partido, CONFIRMADA, paredes);
    const compra = actualizarEstado(confirmada, partido, estadoAlCancelar(confirmada), paredes);
    assert.equal(compra.estado, REEMBOLSADA);
    assert.deepEqual(compra.historial.map((c) => c.estado), [PENDIENTE, CONFIRMADA, REEMBOLSADA]);
  });

  it('no se puede cancelar una UTILIZADA', () => {
    rechaza(() => estadoAlCancelar(seed.compras.paredesAcustico), BusinessRuleError, 'No se puede cancelar una compra UTILIZADA');
    rechaza(() => actualizarEstado(seed.compras.paredesAcustico, seed.eventos.acustico, CANCELADA, paredes),
      BusinessRuleError, 'No se puede pasar de UTILIZADA a CANCELADA');
  });

  it('no se puede cancelar ni pagar si el evento ya se realizó', () => {
    rechaza(() => actualizarEstado(seed.compras.blancoStandup, standup, REEMBOLSADA, blanco), BusinessRuleError, 'El evento ya se realizó');
    rechaza(() => actualizarEstado(compraPendiente(blanco, standup), standup, CONFIRMADA, blanco), BusinessRuleError, 'El evento ya se realizó');
  });

  it('solo el comprador paga o cancela', () => {
    rechaza(() => actualizarEstado(compraPendiente(), partido, CONFIRMADA, blanco), ForbiddenError, 'No podés pasar esta compra a CONFIRMADA');
    rechaza(() => actualizarEstado(compraPendiente(), partido, CANCELADA, dilollo), ForbiddenError, 'No podés pasar esta compra a CANCELADA');
  });

  it('marcar UTILIZADA: solo el organizador y desde las 00:00 del día del evento', () => {
    const confirmada = actualizarEstado(compraPendiente(), partido, CONFIRMADA, paredes);
    rechaza(() => actualizarEstado(confirmada, partido, UTILIZADA, paredes), ForbiddenError, 'No podés pasar esta compra a UTILIZADA');
    rechaza(() => actualizarEstado(confirmada, partido, UTILIZADA, dilollo), BusinessRuleError, 'Todavía no es el día del evento');

    const inicioDelDia = new Date(partido.fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    const antes = new Date(inicioDelDia.getTime() - 1);
    rechaza(() => actualizarEstado(confirmada, partido, UTILIZADA, dilollo, antes), BusinessRuleError, 'Todavía no es el día del evento');

    const compra = actualizarEstado(confirmada, partido, UTILIZADA, dilollo, inicioDelDia);
    assert.equal(compra.estado, UTILIZADA);
    assert.equal(compra.historial.at(-1).usuarioId, dilollo.id);
  });

  it('rechaza las transiciones que no están en la tabla', () => {
    rechaza(() => actualizarEstado(compraPendiente(), partido, UTILIZADA, dilollo), BusinessRuleError, 'No se puede pasar de PENDIENTE a UTILIZADA');
    rechaza(() => actualizarEstado(seed.compras.paredesRock, rock, CONFIRMADA, paredes), BusinessRuleError, 'No se puede pasar de CONFIRMADA a CONFIRMADA');
    rechaza(() => actualizarEstado(seed.compras.blancoRockReembolsada, rock, CONFIRMADA, blanco), BusinessRuleError, 'No se puede pasar de REEMBOLSADA a CONFIRMADA');
    rechaza(() => actualizarEstado(seed.compras.blancoPartidoCancelada, partido, CONFIRMADA, blanco), BusinessRuleError, 'No se puede pasar de CANCELADA a CONFIRMADA');
  });
});

describe('crear evento', () => {
  const { dilollo } = seed.usuarios;
  const ahora = new Date();
  const enUnMes = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const datos = (cambios = {}) => ({
    nombre: 'Charla de prueba', descripcion: 'Descripción', lugar: 'Aula 1', categoriaId: seed.categorias.conferencias.id,
    fecha: enUnMes, multimedia: [],
    tiposEntrada: [{ nombre: 'General', descripcion: 'Sin ubicación', precio: 0, cupo: 50 }],
    ...cambios,
  });

  it('guarda el evento con el usuario activo como organizador', () => {
    const evento = crearEvento(datos(), dilollo, ahora);
    assert.equal(evento.organizadorId, dilollo.id);
    assert.equal(eventoRepository.findById(evento.id).nombre, 'Charla de prueba');
    assert.deepEqual(evento.tiposEntrada.map((t) => t.id), [1]);
  });

  it('rechaza una categoría inexistente', () => {
    assert.throws(() => crearEvento(datos({ categoriaId: 99 }), dilollo, ahora),
      (err) => err.status === 400 && err.message === 'No existe la categoría 99');
  });

  it('rechaza una fecha que no es futura', () => {
    assert.throws(() => crearEvento(datos({ fecha: ahora }), dilollo, ahora),
      (err) => err instanceof BusinessRuleError && err.message === 'La fecha del evento tiene que ser futura');
  });

  it('rechaza tipos de entrada con el nombre repetido, sin importar mayúsculas', () => {
    const tiposEntrada = [
      { nombre: 'Platea', descripcion: 'a', precio: 10, cupo: 1 },
      { nombre: 'platea ', descripcion: 'b', precio: 20, cupo: 1 },
    ];
    assert.throws(() => crearEvento(datos({ tiposEntrada }), dilollo, ahora),
      (err) => err instanceof BusinessRuleError && err.message === 'Hay tipos de entrada con el nombre repetido');
  });
});

describe('detalle de evento', () => {
  it('reemplaza los ids por resúmenes y calcula las disponibles por tipo', () => {
    const { festival } = seed.eventos;
    const { tomas } = seed.usuarios;
    const detalle = detalleEvento(festival, compraRepository.findByEvento(festival.id), seed.categorias.festivales, tomas, puntajeDe(tomas));
    assert.equal(detalle.categoriaId, undefined);
    assert.equal(detalle.organizadorId, undefined);
    assert.deepEqual(detalle.categoria, { id: seed.categorias.festivales.id, nombre: 'Festivales' });
    assert.deepEqual(detalle.organizador, { id: tomas.id, nombre: 'Tomas', apellido: 'Goldszmidt', puntaje: 4.5, cantidadResenias: 14 });
    assert.deepEqual(detalle.tiposEntrada.map((t) => [t.nombre, t.disponibles]), [['General', 1000], ['VIP', 100], ['Backstage', 0]]);
  });
});

describe('puntaje del organizador', () => {
  it('promedia las reseñas de los eventos de cada organizador', () => {
    const puntajes = calcularPuntajes(eventoRepository.findAll(), reseniaRepository.findAll());
    assert.deepEqual(puntajes.get(seed.usuarios.tomas.id), { puntaje: 4.5, cantidadResenias: 14 });
    assert.equal(puntajes.has(seed.usuarios.dilollo.id), false); // sin reseñas
  });

  it('puntajeDe y perfilUsuario dan null y 0 a quien no tiene reseñas', () => {
    const { tomas, dilollo } = seed.usuarios;
    assert.deepEqual(puntajeDe(tomas), { puntaje: 4.5, cantidadResenias: 14 });
    assert.deepEqual(puntajeDe(dilollo), { puntaje: null, cantidadResenias: 0 });
    assert.deepEqual(perfilUsuario(dilollo), { ...dilollo, puntaje: null, cantidadResenias: 0 });
  });
});

describe('búsqueda de eventos', () => {
  const { rock, obra, festival, partido, acustico, standup } = seed.eventos;
  // Otros tests crean eventos; se compara solo contra los del seed.
  const delSeed = new Set(Object.values(seed.eventos).map((e) => e.id));
  const ids = (resultado) => resultado.map((e) => e.id).filter((id) => delSeed.has(id));

  it('por defecto ordena por fecha y oculta los eventos pasados', () => {
    const resultado = ids(buscarEventos());
    assert.deepEqual(resultado, [obra.id, partido.id, rock.id, festival.id]);
    assert.equal(resultado.includes(acustico.id) || resultado.includes(standup.id), false);
  });

  it('ordena por precio desde la entrada más barata', () => {
    assert.equal(precioDesde(festival), 90000);
    assert.deepEqual(ids(buscarEventos({ orden: 'precio' })), [partido.id, obra.id, rock.id, festival.id]);
  });

  it('ordena por puntaje con los organizadores sin reseñas al final', () => {
    assert.deepEqual(ids(buscarEventos({ orden: 'puntaje' })), [obra.id, rock.id, festival.id, partido.id]);
  });

  it('filtra por texto sin tildes, por categoría y por rango de precio', () => {
    assert.deepEqual(ids(buscarEventos({ texto: 'musica' })), [festival.id]);
    assert.deepEqual(ids(buscarEventos({ categoriaId: seed.categorias.musica.id })), [rock.id]);
    assert.deepEqual(ids(buscarEventos({ precioMin: 100000 })), [festival.id]);
    assert.deepEqual(buscarEventos({ categoriaId: 99 }), []);
  });

  it('cada resultado es un resumen con imagen, precio y puntaje', () => {
    const [primero] = buscarEventos({ texto: 'Bernarda' });
    assert.deepEqual(primero.organizador, { id: seed.usuarios.tomas.id, nombre: 'Tomas', apellido: 'Goldszmidt', puntaje: 4.5, cantidadResenias: 14 });
    assert.equal(primero.precioDesde, 20000);
    assert.equal(primero.imagen, 'https://picsum.photos/seed/bernarda/800/400');
    assert.equal(primero.tiposEntrada, undefined);
  });
});

describe('comprar', () => {
  const { paredes, blanco, tomas } = seed.usuarios;
  const { rock, festival, acustico } = seed.eventos;

  function rechaza(fn, status, mensaje) {
    assert.throws(fn, (err) => err.status === status && err.message === mensaje);
  }

  it('crea la compra PENDIENTE con el total calculado y ocupa cupo', () => {
    const platea = tipo(rock, 'Platea');
    const antes = calcularDisponibles(platea, compraRepository.findByEvento(rock.id));
    const compra = comprar({ eventoId: rock.id, tipoEntradaId: platea.id, cantidad: 2 }, paredes);
    assert.equal(compra.estado, EstadoCompra.PENDIENTE);
    assert.equal(compra.compradorId, paredes.id);
    assert.equal(compra.total, 160000);
    assert.equal(calcularDisponibles(platea, compraRepository.findByEvento(rock.id)), antes - 2);
  });

  it('rechaza si no hay cupo, diciendo cuántas quedan', () => {
    rechaza(() => comprar({ eventoId: festival.id, tipoEntradaId: tipo(festival, 'Backstage').id, cantidad: 1 }, paredes),
      409, 'No hay cupo suficiente: quedan 0 entradas');
  });

  it('rechaza un evento o tipo de entrada inexistente', () => {
    rechaza(() => comprar({ eventoId: 99, tipoEntradaId: 1, cantidad: 1 }, paredes), 400, 'No existe el evento 99');
    rechaza(() => comprar({ eventoId: rock.id, tipoEntradaId: 9, cantidad: 1 }, paredes), 400, 'El evento no tiene el tipo de entrada 9');
  });

  it('rechaza un evento pasado y que el organizador compre en su evento', () => {
    rechaza(() => comprar({ eventoId: acustico.id, tipoEntradaId: 1, cantidad: 1 }, blanco), 409, 'El evento ya se realizó');
    rechaza(() => comprar({ eventoId: rock.id, tipoEntradaId: 1, cantidad: 1 }, tomas), 409, 'No podés comprar entradas de un evento que organizás');
  });

  it('detalleCompra reemplaza los ids por resúmenes', () => {
    const detalle = detalleCompra(seed.compras.paredesRock, rock, paredes);
    assert.equal(detalle.eventoId, undefined);
    assert.equal(detalle.compradorId, undefined);
    assert.equal(detalle.tipoEntradaId, undefined);
    assert.deepEqual(detalle.evento, {
      id: rock.id, nombre: rock.nombre, fecha: rock.fecha, lugar: rock.lugar, organizadorId: tomas.id,
      organizador: { id: tomas.id, nombre: 'Tomas', apellido: 'Goldszmidt' },
    });
    assert.deepEqual(detalle.tipoEntrada, { id: 1, nombre: 'Campo', precio: 45000 });
    assert.deepEqual(detalle.comprador, { id: paredes.id, nombre: 'Leandro', apellido: 'Paredes' });
    assert.equal(detalle.mensajes.length, 2);
  });
});

describe('días restantes y quién ve una compra', () => {
  const { paredesRock, paredesObra, paredesAcustico, blancoStandup } = seed.compras;
  const { rock, obra, acustico, standup } = seed.eventos;

  it('cuenta días de calendario solo para las CONFIRMADAS', () => {
    assert.equal(diasRestantes(paredesRock, rock), 20);
    assert.equal(diasRestantes(paredesObra, obra), null); // PENDIENTE
    assert.equal(diasRestantes(paredesAcustico, acustico), null); // UTILIZADA
  });

  it('el mismo día es 0 y el día anterior es 1, aunque falten pocas horas', () => {
    // El rock es a las 21 h: a las 00:30 de ese día es 0, y a las 23:59 del día anterior es 1.
    const tempranoElDia = new Date(rock.fecha);
    tempranoElDia.setHours(0, 30);
    const laNocheAnterior = new Date(rock.fecha);
    laNocheAnterior.setDate(laNocheAnterior.getDate() - 1);
    laNocheAnterior.setHours(23, 59);
    assert.equal(diasRestantes(paredesRock, rock, tempranoElDia), 0);
    assert.equal(diasRestantes(paredesRock, rock, laNocheAnterior), 1);
  });

  it('es null si el evento ya se realizó, aunque esté CONFIRMADA', () => {
    assert.equal(diasRestantes(blancoStandup, standup), null);
  });

  it('la ven el comprador y el organizador, nadie más', () => {
    const { paredes, tomas, blanco, dilollo } = seed.usuarios;
    assert.equal(puedeVer(paredesRock, rock, paredes), true);
    assert.equal(puedeVer(paredesRock, rock, tomas), true);
    assert.equal(puedeVer(paredesRock, rock, blanco), false);
    assert.equal(puedeVer(paredesRock, rock, dilollo), false);
  });

  it('ordenarPorImportancia: por estado y, en pendientes y confirmadas, el evento más próximo primero', () => {
    const dia = 24 * 60 * 60 * 1000;
    const ahora = new Date('2026-11-12T12:00:00Z');
    const compra = (id, estado, enDias) => ({ id, estado, evento: { fecha: new Date(ahora.getTime() + enDias * dia) } });
    const lista = [
      compra(1, 'UTILIZADA', -30),
      compra(2, 'CONFIRMADA', 20),
      compra(3, 'PENDIENTE', 10),
      compra(4, 'CONFIRMADA', 5),
      compra(5, 'CONFIRMADA', -2), // evento que ya pasó: al final de las confirmadas
      compra(6, 'REEMBOLSADA', 15),
      compra(7, 'UTILIZADA', -10), // historial: la más reciente primero
      compra(8, 'CANCELADA', 3),
    ];
    assert.deepEqual(ordenarPorImportancia(lista, ahora).map((c) => c.id), [3, 4, 2, 5, 7, 1, 8, 6]);
  });

  it('cantidadesPorEstado cuenta todas y solo los estados que aparecen', () => {
    assert.deepEqual(cantidadesPorEstado([{ estado: 'PENDIENTE' }, { estado: 'UTILIZADA' }, { estado: 'UTILIZADA' }]),
      { todas: 3, PENDIENTE: 1, UTILIZADA: 2 });
    assert.deepEqual(cantidadesPorEstado([]), { todas: 0 });
  });

  it('detalleCompra incluye diasRestantes', () => {
    assert.equal(detalleCompra(paredesRock, rock, seed.usuarios.paredes).diasRestantes, 20);
  });
});

describe('ventas del organizador', () => {
  const { tomas, dilollo } = seed.usuarios;
  const { rock, obra, festival, acustico } = seed.eventos;
  const delSeed = new Set(Object.values(seed.eventos).map((e) => e.id));

  it('eventosOrganizados trae solo los suyos: primero los próximos y después los realizados', () => {
    const lista = eventosOrganizados(tomas);
    const ids = lista.map((e) => e.id).filter((id) => delSeed.has(id));
    assert.deepEqual(ids, [obra.id, rock.id, festival.id, acustico.id]);
    assert.equal(lista.every((e) => e.organizador.id === tomas.id), true);
    // Los realizados, del más reciente al más viejo: el acústico (hace 15 días) es el primero.
    const realizados = lista.filter((e) => e.fecha <= new Date());
    assert.equal(realizados[0].id, acustico.id);
    const fechas = realizados.map((e) => e.fecha.getTime());
    assert.deepEqual(fechas, [...fechas].sort((a, b) => b - a));
  });

  it('filtroOrganizador y cantidadesOrganizador separan próximos, realizados y con mensajes nuevos', () => {
    const lista = eventosOrganizados(tomas).map((e) => ({ ...e, conMensajesNoLeidos: e.id === rock.id ? 1 : 0 }));
    assert.deepEqual(lista.filter((e) => filtroOrganizador(e, 'conMensajesNuevos')).map((e) => e.id), [rock.id]);
    assert.ok(lista.filter((e) => filtroOrganizador(e, 'realizados')).some((e) => e.id === acustico.id));
    assert.ok(!lista.filter((e) => filtroOrganizador(e, 'proximos')).some((e) => e.id === acustico.id));
    assert.equal(lista.filter((e) => filtroOrganizador(e, undefined)).length, lista.length);
    const cantidades = cantidadesOrganizador(lista);
    assert.equal(cantidades.todos, lista.length);
    assert.equal(cantidades.proximos + cantidades.realizados, cantidades.todos);
    assert.equal(cantidades.conMensajesNuevos, 1);
  });

  it('solo el organizador ve las ventas de su evento', () => {
    assert.doesNotThrow(() => verificarOrganizador(rock, tomas));
    assert.throws(() => verificarOrganizador(rock, dilollo),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el organizador puede ver las ventas de este evento');
  });

  it('masRecientesPrimero ordena por la fecha de compra, sin modificar la lista', () => {
    const { paredesRock, blancoRockReembolsada } = seed.compras;
    const compras = [blancoRockReembolsada, paredesRock]; // −8 y −5 días
    assert.deepEqual(masRecientesPrimero(compras).map((c) => c.id), [paredesRock.id, blancoRockReembolsada.id]);
    assert.deepEqual(compras.map((c) => c.id), [blancoRockReembolsada.id, paredesRock.id]);
  });
});

describe('chat de la compra', () => {
  const { paredes, tomas, dilollo } = seed.usuarios;
  const { acustico } = seed.eventos;

  it('mensajesConAutor agrega el nombre de quien escribió cada mensaje', () => {
    const mensajes = mensajesConAutor(seed.compras.paredesRock.mensajes);
    assert.deepEqual(mensajes.map((m) => [m.autor.nombre, m.mensaje]), [
      ['Leandro', '¿Se puede entrar con mochila?'],
      ['Tomas', 'Sí, la revisan en la puerta.'],
    ]);
    assert.equal(mensajes[0].usuarioId, undefined);
  });

  it('comprador y organizador escriben en cualquier estado, incluso con el evento pasado', () => {
    const compra = seed.compras.paredesAcustico; // UTILIZADA, evento pasado
    const ahora = new Date();
    const mensaje = enviarMensaje(compra, acustico, tomas, '¡Gracias por venir!', ahora);
    assert.deepEqual(mensaje, { autor: { id: tomas.id, nombre: 'Tomas', apellido: 'Goldszmidt' }, mensaje: '¡Gracias por venir!', enviado: ahora });
    enviarMensaje(compra, acustico, paredes, 'A ustedes');
    assert.deepEqual(compraRepository.findById(compra.id).mensajes.map((m) => m.mensaje), ['¡Gracias por venir!', 'A ustedes']);
  });

  it('nadie más puede escribir', () => {
    assert.throws(() => enviarMensaje(seed.compras.paredesAcustico, acustico, dilollo, 'hola'),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el comprador y el organizador pueden escribir en este chat');
  });

  it('rolEnCompra distingue al comprador del organizador', () => {
    const { paredesRock } = seed.compras;
    const { rock } = seed.eventos;
    assert.equal(rolEnCompra(paredesRock, rock, paredes), 'comprador');
    assert.equal(rolEnCompra(paredesRock, rock, tomas), 'organizador');
    assert.equal(rolEnCompra(paredesRock, rock, dilollo), null);
  });

  it('conversaciones: solo las compras con chat, primero las sin leer y después por el último mensaje', () => {
    const { rock } = seed.eventos;
    const { paredesRock, blancoRockReembolsada } = seed.compras;
    const compras = compraRepository.findByEvento(rock.id);
    const lista = conversaciones(compras, rock, tomas);
    // Las ventas del Rock sin mensajes quedan afuera (en el seed, 12 de 13 tienen chat).
    assert.equal(lista.length, 12);
    assert.ok(compras.length > lista.length);
    assert.ok(lista.every((compra) => compra.mensajes.length > 0));
    // La de Blanco (sin leer, hace 3 días) primero; después la de Paredes (leída, hace 4).
    assert.deepEqual(lista.slice(0, 2).map((c) => c.id), [blancoRockReembolsada.id, paredesRock.id]);
    const ultimos = lista.slice(1).map((c) => c.mensajes.at(-1).enviado.getTime());
    assert.deepEqual(ultimos, [...ultimos].sort((a, b) => b - a));
  });

  it('conversaciones: una sin leer va arriba aunque su último mensaje sea más viejo', () => {
    const { rock } = seed.eventos;
    const { paredesRock, blancoRockReembolsada } = seed.compras;
    // Tomas abre el chat de Blanco y Paredes le escribe de nuevo (antes que la pregunta de Blanco, hace 3 días):
    // ahora la de Paredes es la sin leer y va primero.
    const leida = { ...blancoRockReembolsada, mensajesLeidosHasta: { ...blancoRockReembolsada.mensajesLeidosHasta, organizador: new Date() } };
    const nueva = { ...paredesRock, mensajes: [...paredesRock.mensajes, { usuarioId: paredes.id, mensaje: 'Gracias', enviado: new Date(paredesRock.mensajesLeidosHasta.organizador.getTime() + 3600e3) }] };
    const lista = conversaciones([leida, nueva], rock, tomas);
    assert.deepEqual(lista.map((c) => c.id), [paredesRock.id, blancoRockReembolsada.id]);
  });

  it('mensajesNoLeidos: los del otro posteriores a la última vez que abrió el chat', () => {
    // En el seed Paredes no abrió la respuesta de Tomas, y Tomas no abrió la pregunta de Blanco.
    const { paredesRock, blancoRockReembolsada } = seed.compras;
    const { rock } = seed.eventos;
    assert.equal(mensajesNoLeidos(paredesRock, rock, paredes), 1);
    assert.equal(mensajesNoLeidos(paredesRock, rock, tomas), 0);
    assert.equal(mensajesNoLeidos(blancoRockReembolsada, rock, tomas), 1);
    assert.equal(mensajesNoLeidos(blancoRockReembolsada, rock, seed.usuarios.blanco), 0);
    assert.equal(mensajesNoLeidos(paredesRock, rock, dilollo), 0);
  });

  it('cantidadConMensajesNoLeidos cuenta las compras con mensajes nuevos para el organizador', () => {
    const { rock } = seed.eventos;
    assert.equal(cantidadConMensajesNoLeidos(compraRepository.findByEvento(rock.id), rock, tomas), 1);
  });

  it('leerMensajes deja el chat leído solo para quien lo abre', () => {
    const { rock } = seed.eventos;
    const compra = leerMensajes(compraRepository.findById(seed.compras.blancoRockReembolsada.id), rock, tomas);
    assert.equal(mensajesNoLeidos(compra, rock, tomas), 0);
    assert.equal(cantidadConMensajesNoLeidos(compraRepository.findByEvento(rock.id), rock, tomas), 0);
    assert.throws(() => leerMensajes(compra, rock, dilollo),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el comprador y el organizador pueden leer este chat');
  });

  it('quien escribe ya leyó su chat; el otro tiene un mensaje nuevo', () => {
    const { obra } = seed.eventos;
    const compra = seed.compras.paredesObra; // sin mensajes
    enviarMensaje(compra, obra, paredes, '¿Hay estacionamiento?');
    const actualizada = compraRepository.findById(compra.id);
    assert.equal(mensajesNoLeidos(actualizada, obra, paredes), 0);
    assert.equal(mensajesNoLeidos(actualizada, obra, tomas), 1);
  });

  it('detalleCompra suma mensajesNoLeidos para quien pide y no muestra hasta cuándo leyó cada uno', () => {
    const { paredesRock } = seed.compras;
    const detalle = detalleCompra(paredesRock, seed.eventos.rock, paredes, paredes);
    assert.equal(detalle.mensajesNoLeidos, 1);
    assert.equal(detalle.mensajesLeidosHasta, undefined);
    assert.equal(detalleCompra(paredesRock, seed.eventos.rock, paredes).mensajesNoLeidos, undefined);
  });

  it('requireString respeta maxLength', () => {
    assert.equal(requireString('  hola  ', 'mensaje', { maxLength: 4 }), 'hola');
    assert.throws(() => requireString('a'.repeat(501), 'mensaje', { maxLength: 500 }),
      (err) => err.status === 400 && err.message === 'El campo mensaje puede tener como máximo 500 caracteres');
  });
});

describe('reseñas', () => {
  const { paredes, blanco, tomas, dilollo } = seed.usuarios;
  const { standup, acustico } = seed.eventos;

  function rechaza(fn, status, mensaje) {
    assert.throws(fn, (err) => err.status === status && err.message === mensaje);
  }

  it('reseniasDeOrganizador trae las de sus eventos con comprador y evento', () => {
    // Del evento más reciente al más viejo: primero el acústico y después los eventos viejos del seed.
    const resenias = reseniasDeOrganizador(tomas);
    assert.equal(resenias.length, 14);
    assert.deepEqual(resenias.slice(0, 3).map((r) => [r.comprador.nombre, r.evento.nombre, r.puntuacion]), [
      ['Lautaro', 'Acústico en el Gran Rex', 4],
      ['Leandro', 'Acústico en el Gran Rex', 5],
      ['Lautaro', 'Recital de Cuarteto', 5],
    ]);
  });

  it('reseniaDeCompra trae la reseña del comprador para ese evento, o null', () => {
    assert.deepEqual(reseniaDeCompra(seed.compras.paredesAcustico),
      { id: seed.resenias.paredesAcustico.id, puntuacion: 5, detalle: seed.resenias.paredesAcustico.detalle });
    assert.equal(reseniaDeCompra(seed.compras.paredesStandup), null);
  });

  it('quien usó su entrada puede reseñar, una sola vez', () => {
    const resenia = crearResenia({ eventoId: standup.id, puntuacion: 4, detalle: 'Muy divertido' }, paredes);
    assert.equal(reseniaDeCompra(seed.compras.paredesStandup).id, resenia.id);
    assert.deepEqual(resenia.comprador, { id: paredes.id, nombre: 'Leandro', apellido: 'Paredes' });
    assert.deepEqual(resenia.evento, { id: standup.id, nombre: standup.nombre, fecha: standup.fecha });
    assert.equal(reseniasDeOrganizador(dilollo).some((r) => r.id === resenia.id), true);
    rechaza(() => crearResenia({ eventoId: standup.id, puntuacion: 5, detalle: 'Otra vez' }, paredes), 409, 'Ya reseñaste este evento');
  });

  it('no puede reseñar quien no tiene la compra UTILIZADA', () => {
    rechaza(() => crearResenia({ eventoId: standup.id, puntuacion: 3, detalle: 'x' }, blanco), 409, 'Solo podés reseñar eventos a los que asististe'); // CONFIRMADA
    rechaza(() => crearResenia({ eventoId: acustico.id, puntuacion: 3, detalle: 'x' }, dilollo), 409, 'Solo podés reseñar eventos a los que asististe'); // sin compra
  });

  it('rechaza un evento inexistente', () => {
    rechaza(() => crearResenia({ eventoId: 99, puntuacion: 3, detalle: 'x' }, paredes), 400, 'No existe el evento 99');
  });
});
