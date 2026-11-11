import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import { calcularDisponibles, hayCupoPara } from '../src/domain/tipoEntrada.js';
import { tuPrecioEstaEntre, crearEvento, detalleEvento, buscarEventos, precioDesde, eventosOrganizados, verificarOrganizador } from '../src/domain/evento.js';
import { calcularPuntajes, crearResenia, perfilUsuario, puntajeDe, reseniaDeCompra, reseniasDeOrganizador } from '../src/domain/resenia.js';
import * as reseniaRepository from '../src/persistence/repositories/reseniaRepository.js';
import * as eventoRepository from '../src/persistence/repositories/eventoRepository.js';
import {
  actualizarEstado, estadoAlCancelar, comprar, detalleCompra, diasRestantes, puedeVer, masRecientesPrimero, enviarMensaje, mensajesConAutor,
  esperaRespuestaDe, cantidadSinResponder,
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

  it('una REEMBOLSADA libera el cupo', () => {
    const compras = compraRepository.findByEvento(rock.id);
    assert.equal(calcularDisponibles(tipo(rock, 'Platea'), compras), 200);
  });

  it('solo cuenta las compras de ese tipo de entrada', () => {
    const compras = compraRepository.findByEvento(rock.id);
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
  const { sofia, juan, martin } = seed.usuarios;
  const { partido, standup, rock } = seed.eventos;

  // Las compras que se modifican se crean acá, en el partido (futuro, de Martín),
  // para no tocar las del seed que usan los tests de cupo.
  function compraPendiente(comprador = sofia, evento = partido) {
    return compraRepository.create({ compradorId: comprador.id, eventoId: evento.id, tipoEntradaId: 1, cantidad: 1, total: 15000 });
  }

  function rechaza(fn, Clase, mensaje) {
    assert.throws(fn, (err) => err instanceof Clase && err.message === mensaje);
  }

  it('pagar: PENDIENTE → CONFIRMADA y suma el cambio al historial', () => {
    const ahora = new Date();
    const compra = actualizarEstado(compraPendiente(), partido, CONFIRMADA, sofia, ahora);
    assert.equal(compra.estado, CONFIRMADA);
    assert.deepEqual(compra.historial.map((c) => c.estado), [PENDIENTE, CONFIRMADA]);
    assert.deepEqual(compra.historial.at(-1), { estado: CONFIRMADA, usuarioId: sofia.id, fechaHora: ahora });
    assert.equal(compraRepository.findById(compra.id).estado, CONFIRMADA);
  });

  it('cancelar una PENDIENTE la deja CANCELADA', () => {
    const pendiente = compraPendiente();
    const compra = actualizarEstado(pendiente, partido, estadoAlCancelar(pendiente), sofia);
    assert.equal(compra.estado, CANCELADA);
  });

  it('cancelar una CONFIRMADA la deja REEMBOLSADA', () => {
    const confirmada = actualizarEstado(compraPendiente(), partido, CONFIRMADA, sofia);
    const compra = actualizarEstado(confirmada, partido, estadoAlCancelar(confirmada), sofia);
    assert.equal(compra.estado, REEMBOLSADA);
    assert.deepEqual(compra.historial.map((c) => c.estado), [PENDIENTE, CONFIRMADA, REEMBOLSADA]);
  });

  it('no se puede cancelar una UTILIZADA', () => {
    rechaza(() => estadoAlCancelar(seed.compras.sofiaAcustico), BusinessRuleError, 'No se puede cancelar una compra UTILIZADA');
    rechaza(() => actualizarEstado(seed.compras.sofiaAcustico, seed.eventos.acustico, CANCELADA, sofia),
      BusinessRuleError, 'No se puede pasar de UTILIZADA a CANCELADA');
  });

  it('no se puede cancelar ni pagar si el evento ya se realizó', () => {
    rechaza(() => actualizarEstado(seed.compras.juanStandup, standup, REEMBOLSADA, juan), BusinessRuleError, 'El evento ya se realizó');
    rechaza(() => actualizarEstado(compraPendiente(juan, standup), standup, CONFIRMADA, juan), BusinessRuleError, 'El evento ya se realizó');
  });

  it('solo el comprador paga o cancela', () => {
    rechaza(() => actualizarEstado(compraPendiente(), partido, CONFIRMADA, juan), ForbiddenError, 'No podés pasar esta compra a CONFIRMADA');
    rechaza(() => actualizarEstado(compraPendiente(), partido, CANCELADA, martin), ForbiddenError, 'No podés pasar esta compra a CANCELADA');
  });

  it('marcar UTILIZADA: solo el organizador y desde las 00:00 del día del evento', () => {
    const confirmada = actualizarEstado(compraPendiente(), partido, CONFIRMADA, sofia);
    rechaza(() => actualizarEstado(confirmada, partido, UTILIZADA, sofia), ForbiddenError, 'No podés pasar esta compra a UTILIZADA');
    rechaza(() => actualizarEstado(confirmada, partido, UTILIZADA, martin), BusinessRuleError, 'Todavía no es el día del evento');

    const inicioDelDia = new Date(partido.fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    const antes = new Date(inicioDelDia.getTime() - 1);
    rechaza(() => actualizarEstado(confirmada, partido, UTILIZADA, martin, antes), BusinessRuleError, 'Todavía no es el día del evento');

    const compra = actualizarEstado(confirmada, partido, UTILIZADA, martin, inicioDelDia);
    assert.equal(compra.estado, UTILIZADA);
    assert.equal(compra.historial.at(-1).usuarioId, martin.id);
  });

  it('rechaza las transiciones que no están en la tabla', () => {
    rechaza(() => actualizarEstado(compraPendiente(), partido, UTILIZADA, martin), BusinessRuleError, 'No se puede pasar de PENDIENTE a UTILIZADA');
    rechaza(() => actualizarEstado(seed.compras.sofiaRock, rock, CONFIRMADA, sofia), BusinessRuleError, 'No se puede pasar de CONFIRMADA a CONFIRMADA');
    rechaza(() => actualizarEstado(seed.compras.juanRockReembolsada, rock, CONFIRMADA, juan), BusinessRuleError, 'No se puede pasar de REEMBOLSADA a CONFIRMADA');
    rechaza(() => actualizarEstado(seed.compras.juanPartidoCancelada, partido, CONFIRMADA, juan), BusinessRuleError, 'No se puede pasar de CANCELADA a CONFIRMADA');
  });
});

describe('crear evento', () => {
  const { martin } = seed.usuarios;
  const ahora = new Date();
  const enUnMes = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const datos = (cambios = {}) => ({
    nombre: 'Charla de prueba', descripcion: 'Descripción', lugar: 'Aula 1', categoriaId: seed.categorias.conferencias.id,
    fecha: enUnMes, multimedia: [],
    tiposEntrada: [{ nombre: 'General', descripcion: 'Sin ubicación', precio: 0, cupo: 50 }],
    ...cambios,
  });

  it('guarda el evento con el usuario activo como organizador', () => {
    const evento = crearEvento(datos(), martin, ahora);
    assert.equal(evento.organizadorId, martin.id);
    assert.equal(eventoRepository.findById(evento.id).nombre, 'Charla de prueba');
    assert.deepEqual(evento.tiposEntrada.map((t) => t.id), [1]);
  });

  it('rechaza una categoría inexistente', () => {
    assert.throws(() => crearEvento(datos({ categoriaId: 99 }), martin, ahora),
      (err) => err.status === 400 && err.message === 'No existe la categoría 99');
  });

  it('rechaza una fecha que no es futura', () => {
    assert.throws(() => crearEvento(datos({ fecha: ahora }), martin, ahora),
      (err) => err instanceof BusinessRuleError && err.message === 'La fecha del evento tiene que ser futura');
  });

  it('rechaza tipos de entrada con el nombre repetido, sin importar mayúsculas', () => {
    const tiposEntrada = [
      { nombre: 'Platea', descripcion: 'a', precio: 10, cupo: 1 },
      { nombre: 'platea ', descripcion: 'b', precio: 20, cupo: 1 },
    ];
    assert.throws(() => crearEvento(datos({ tiposEntrada }), martin, ahora),
      (err) => err instanceof BusinessRuleError && err.message === 'Hay tipos de entrada con el nombre repetido');
  });
});

describe('detalle de evento', () => {
  it('reemplaza los ids por resúmenes y calcula las disponibles por tipo', () => {
    const { festival } = seed.eventos;
    const { lucia } = seed.usuarios;
    const detalle = detalleEvento(festival, compraRepository.findByEvento(festival.id), seed.categorias.festivales, lucia, puntajeDe(lucia));
    assert.equal(detalle.categoriaId, undefined);
    assert.equal(detalle.organizadorId, undefined);
    assert.deepEqual(detalle.categoria, { id: seed.categorias.festivales.id, nombre: 'Festivales' });
    assert.deepEqual(detalle.organizador, { id: lucia.id, nombre: 'Lucía', apellido: 'Fernández', puntaje: 4.5, cantidadResenias: 2 });
    assert.deepEqual(detalle.tiposEntrada.map((t) => [t.nombre, t.disponibles]), [['General', 1000], ['VIP', 100], ['Backstage', 0]]);
  });
});

describe('puntaje del organizador', () => {
  it('promedia las reseñas de los eventos de cada organizador', () => {
    const puntajes = calcularPuntajes(eventoRepository.findAll(), reseniaRepository.findAll());
    assert.deepEqual(puntajes.get(seed.usuarios.lucia.id), { puntaje: 4.5, cantidadResenias: 2 });
    assert.equal(puntajes.has(seed.usuarios.martin.id), false); // sin reseñas
  });

  it('puntajeDe y perfilUsuario dan null y 0 a quien no tiene reseñas', () => {
    const { lucia, martin } = seed.usuarios;
    assert.deepEqual(puntajeDe(lucia), { puntaje: 4.5, cantidadResenias: 2 });
    assert.deepEqual(puntajeDe(martin), { puntaje: null, cantidadResenias: 0 });
    assert.deepEqual(perfilUsuario(martin), { ...martin, puntaje: null, cantidadResenias: 0 });
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
    assert.deepEqual(primero.organizador, { id: seed.usuarios.lucia.id, nombre: 'Lucía', apellido: 'Fernández', puntaje: 4.5, cantidadResenias: 2 });
    assert.equal(primero.precioDesde, 20000);
    assert.equal(primero.imagen, 'https://picsum.photos/seed/bernarda/800/400');
    assert.equal(primero.tiposEntrada, undefined);
  });
});

describe('comprar', () => {
  const { sofia, juan, lucia } = seed.usuarios;
  const { rock, festival, acustico } = seed.eventos;

  function rechaza(fn, status, mensaje) {
    assert.throws(fn, (err) => err.status === status && err.message === mensaje);
  }

  it('crea la compra PENDIENTE con el total calculado y ocupa cupo', () => {
    const platea = tipo(rock, 'Platea');
    const antes = calcularDisponibles(platea, compraRepository.findByEvento(rock.id));
    const compra = comprar({ eventoId: rock.id, tipoEntradaId: platea.id, cantidad: 2 }, sofia);
    assert.equal(compra.estado, EstadoCompra.PENDIENTE);
    assert.equal(compra.compradorId, sofia.id);
    assert.equal(compra.total, 160000);
    assert.equal(calcularDisponibles(platea, compraRepository.findByEvento(rock.id)), antes - 2);
  });

  it('rechaza si no hay cupo, diciendo cuántas quedan', () => {
    rechaza(() => comprar({ eventoId: festival.id, tipoEntradaId: tipo(festival, 'Backstage').id, cantidad: 1 }, sofia),
      409, 'No hay cupo suficiente: quedan 0 entradas');
  });

  it('rechaza un evento o tipo de entrada inexistente', () => {
    rechaza(() => comprar({ eventoId: 99, tipoEntradaId: 1, cantidad: 1 }, sofia), 400, 'No existe el evento 99');
    rechaza(() => comprar({ eventoId: rock.id, tipoEntradaId: 9, cantidad: 1 }, sofia), 400, 'El evento no tiene el tipo de entrada 9');
  });

  it('rechaza un evento pasado y que el organizador compre en su evento', () => {
    rechaza(() => comprar({ eventoId: acustico.id, tipoEntradaId: 1, cantidad: 1 }, juan), 409, 'El evento ya se realizó');
    rechaza(() => comprar({ eventoId: rock.id, tipoEntradaId: 1, cantidad: 1 }, lucia), 409, 'No podés comprar entradas de un evento que organizás');
  });

  it('detalleCompra reemplaza los ids por resúmenes', () => {
    const detalle = detalleCompra(seed.compras.sofiaRock, rock, sofia);
    assert.equal(detalle.eventoId, undefined);
    assert.equal(detalle.compradorId, undefined);
    assert.equal(detalle.tipoEntradaId, undefined);
    assert.deepEqual(detalle.evento, { id: rock.id, nombre: rock.nombre, fecha: rock.fecha, lugar: rock.lugar, organizadorId: lucia.id });
    assert.deepEqual(detalle.tipoEntrada, { id: 1, nombre: 'Campo', precio: 45000 });
    assert.deepEqual(detalle.comprador, { id: sofia.id, nombre: 'Sofía', apellido: 'Pérez' });
    assert.equal(detalle.mensajes.length, 2);
  });
});

describe('días restantes y quién ve una compra', () => {
  const { sofiaRock, sofiaObra, sofiaAcustico, juanStandup } = seed.compras;
  const { rock, obra, acustico, standup } = seed.eventos;

  it('cuenta días de calendario solo para las CONFIRMADAS', () => {
    assert.equal(diasRestantes(sofiaRock, rock), 20);
    assert.equal(diasRestantes(sofiaObra, obra), null); // PENDIENTE
    assert.equal(diasRestantes(sofiaAcustico, acustico), null); // UTILIZADA
  });

  it('el mismo día es 0 y el día anterior es 1, aunque falten pocas horas', () => {
    // El rock es a las 21 h: a las 00:30 de ese día es 0, y a las 23:59 del día anterior es 1.
    const tempranoElDia = new Date(rock.fecha);
    tempranoElDia.setHours(0, 30);
    const laNocheAnterior = new Date(rock.fecha);
    laNocheAnterior.setDate(laNocheAnterior.getDate() - 1);
    laNocheAnterior.setHours(23, 59);
    assert.equal(diasRestantes(sofiaRock, rock, tempranoElDia), 0);
    assert.equal(diasRestantes(sofiaRock, rock, laNocheAnterior), 1);
  });

  it('es null si el evento ya se realizó, aunque esté CONFIRMADA', () => {
    assert.equal(diasRestantes(juanStandup, standup), null);
  });

  it('la ven el comprador y el organizador, nadie más', () => {
    const { sofia, lucia, juan, martin } = seed.usuarios;
    assert.equal(puedeVer(sofiaRock, rock, sofia), true);
    assert.equal(puedeVer(sofiaRock, rock, lucia), true);
    assert.equal(puedeVer(sofiaRock, rock, juan), false);
    assert.equal(puedeVer(sofiaRock, rock, martin), false);
  });

  it('detalleCompra incluye diasRestantes', () => {
    assert.equal(detalleCompra(sofiaRock, rock, seed.usuarios.sofia).diasRestantes, 20);
  });
});

describe('ventas del organizador', () => {
  const { lucia, martin } = seed.usuarios;
  const { rock, obra, festival, acustico } = seed.eventos;
  const delSeed = new Set(Object.values(seed.eventos).map((e) => e.id));

  it('eventosOrganizados trae solo los suyos, con los pasados, por fecha', () => {
    const ids = eventosOrganizados(lucia).map((e) => e.id).filter((id) => delSeed.has(id));
    assert.deepEqual(ids, [acustico.id, obra.id, rock.id, festival.id]);
    assert.equal(eventosOrganizados(lucia).every((e) => e.organizador.id === lucia.id), true);
  });

  it('solo el organizador ve las ventas de su evento', () => {
    assert.doesNotThrow(() => verificarOrganizador(rock, lucia));
    assert.throws(() => verificarOrganizador(rock, martin),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el organizador puede ver las ventas de este evento');
  });

  it('masRecientesPrimero ordena por la fecha de compra, sin modificar la lista', () => {
    const { sofiaRock, juanRockReembolsada } = seed.compras;
    const compras = [juanRockReembolsada, sofiaRock]; // −8 y −5 días
    assert.deepEqual(masRecientesPrimero(compras).map((c) => c.id), [sofiaRock.id, juanRockReembolsada.id]);
    assert.deepEqual(compras.map((c) => c.id), [juanRockReembolsada.id, sofiaRock.id]);
  });
});

describe('chat de la compra', () => {
  const { sofia, lucia, martin } = seed.usuarios;
  const { acustico } = seed.eventos;

  it('mensajesConAutor agrega el nombre de quien escribió cada mensaje', () => {
    const mensajes = mensajesConAutor(seed.compras.sofiaRock.mensajes);
    assert.deepEqual(mensajes.map((m) => [m.autor.nombre, m.mensaje]), [
      ['Sofía', '¿Se puede entrar con mochila?'],
      ['Lucía', 'Sí, chica, la revisan en la puerta.'],
    ]);
    assert.equal(mensajes[0].usuarioId, undefined);
  });

  it('comprador y organizador escriben en cualquier estado, incluso con el evento pasado', () => {
    const compra = seed.compras.sofiaAcustico; // UTILIZADA, evento pasado
    const ahora = new Date();
    const mensaje = enviarMensaje(compra, acustico, lucia, '¡Gracias por venir!', ahora);
    assert.deepEqual(mensaje, { autor: { id: lucia.id, nombre: 'Lucía', apellido: 'Fernández' }, mensaje: '¡Gracias por venir!', enviado: ahora });
    enviarMensaje(compra, acustico, sofia, 'A ustedes');
    assert.deepEqual(compraRepository.findById(compra.id).mensajes.map((m) => m.mensaje), ['¡Gracias por venir!', 'A ustedes']);
  });

  it('nadie más puede escribir', () => {
    assert.throws(() => enviarMensaje(seed.compras.sofiaAcustico, acustico, martin, 'hola'),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el comprador y el organizador pueden escribir en este chat');
  });

  it('esperaRespuestaDe: el chat espera a quien no escribió el último mensaje', () => {
    const { sofiaRock, juanStandup } = seed.compras; // Rock: el último es de Lucía; Stand-up de Juan: sin mensajes
    assert.equal(esperaRespuestaDe(sofiaRock, sofia), true);
    assert.equal(esperaRespuestaDe(sofiaRock, lucia), false);
    assert.equal(esperaRespuestaDe(juanStandup, seed.usuarios.martin), false);

    const pregunta = { ...sofiaRock, mensajes: [...sofiaRock.mensajes, { usuarioId: sofia.id, mensaje: '¿A qué hora abren?', enviado: new Date() }] };
    assert.equal(esperaRespuestaDe(pregunta, sofia), false);
    assert.equal(esperaRespuestaDe(pregunta, lucia), true);
  });

  it('cantidadSinResponder cuenta las compras que esperan al organizador', () => {
    // En el seed, Juan preguntó por el reembolso de Noche de Rock y Lucía no respondió.
    const { sofiaRock, juanRockReembolsada } = seed.compras;
    const respondida = { ...juanRockReembolsada, mensajes: [...juanRockReembolsada.mensajes, { usuarioId: lucia.id, mensaje: 'En 5 días hábiles.', enviado: new Date() }] };
    assert.equal(cantidadSinResponder([sofiaRock, juanRockReembolsada], lucia), 1);
    assert.equal(cantidadSinResponder([sofiaRock, respondida], lucia), 0);
  });

  it('requireString respeta maxLength', () => {
    assert.equal(requireString('  hola  ', 'mensaje', { maxLength: 4 }), 'hola');
    assert.throws(() => requireString('a'.repeat(501), 'mensaje', { maxLength: 500 }),
      (err) => err.status === 400 && err.message === 'El campo mensaje puede tener como máximo 500 caracteres');
  });
});

describe('reseñas', () => {
  const { sofia, juan, lucia, martin } = seed.usuarios;
  const { standup, acustico } = seed.eventos;

  function rechaza(fn, status, mensaje) {
    assert.throws(fn, (err) => err.status === status && err.message === mensaje);
  }

  it('reseniasDeOrganizador trae las de sus eventos con comprador y evento', () => {
    const resenias = reseniasDeOrganizador(lucia);
    assert.deepEqual(resenias.map((r) => [r.comprador.nombre, r.evento.nombre, r.puntuacion]), [
      ['Juan', 'Acústico en el Gran Rex', 4],
      ['Sofía', 'Acústico en el Gran Rex', 5],
    ]);
  });

  it('reseniaDeCompra trae la reseña del comprador para ese evento, o null', () => {
    assert.deepEqual(reseniaDeCompra(seed.compras.sofiaAcustico),
      { id: seed.resenias.sofiaAcustico.id, puntuacion: 5, detalle: seed.resenias.sofiaAcustico.detalle });
    assert.equal(reseniaDeCompra(seed.compras.sofiaStandup), null);
  });

  it('quien usó su entrada puede reseñar, una sola vez', () => {
    const resenia = crearResenia({ eventoId: standup.id, puntuacion: 4, detalle: 'Muy divertido' }, sofia);
    assert.equal(reseniaDeCompra(seed.compras.sofiaStandup).id, resenia.id);
    assert.deepEqual(resenia.comprador, { id: sofia.id, nombre: 'Sofía', apellido: 'Pérez' });
    assert.deepEqual(resenia.evento, { id: standup.id, nombre: standup.nombre, fecha: standup.fecha });
    assert.equal(reseniasDeOrganizador(martin).some((r) => r.id === resenia.id), true);
    rechaza(() => crearResenia({ eventoId: standup.id, puntuacion: 5, detalle: 'Otra vez' }, sofia), 409, 'Ya reseñaste este evento');
  });

  it('no puede reseñar quien no tiene la compra UTILIZADA', () => {
    rechaza(() => crearResenia({ eventoId: standup.id, puntuacion: 3, detalle: 'x' }, juan), 409, 'Solo podés reseñar eventos a los que asististe'); // CONFIRMADA
    rechaza(() => crearResenia({ eventoId: acustico.id, puntuacion: 3, detalle: 'x' }, martin), 409, 'Solo podés reseñar eventos a los que asististe'); // sin compra
  });

  it('rechaza un evento inexistente', () => {
    rechaza(() => crearResenia({ eventoId: 99, puntuacion: 3, detalle: 'x' }, sofia), 400, 'No existe el evento 99');
  });
});
