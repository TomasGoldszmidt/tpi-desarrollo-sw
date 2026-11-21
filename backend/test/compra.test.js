import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import { calcularDisponibles, hayCupoPara } from '../src/domain/tipoEntrada.js';
import {
  actualizarEstado, estadoAlCancelar, nuevaCompra, detalleCompra, diasRestantes, puedeVer, masRecientesPrimero, resumenVentas,
  enviarMensaje, mensajesConAutor, ordenarPorImportancia, cantidadesPorEstado,
  mensajesNoLeidos, cantidadConMensajesNoLeidos, leerMensajes, rolEnCompra, conversaciones,
} from '../src/domain/compra.js';
import * as compraService from '../src/services/compraService.js';
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
    const pendiente = compraPendiente();
    const compra = actualizarEstado(pendiente, partido, CONFIRMADA, paredes, ahora);
    assert.equal(compra.estado, CONFIRMADA);
    assert.deepEqual(compra.historial.map((c) => c.estado), [PENDIENTE, CONFIRMADA]);
    assert.deepEqual(compra.historial.at(-1), { estado: CONFIRMADA, usuarioId: paredes.id, fechaHora: ahora });
    // El dominio no guarda: la compra sigue PENDIENTE hasta que la guarda el service.
    assert.equal(compraRepository.findById(pendiente.id).estado, PENDIENTE);
  });

  it('el service guarda el pago y devuelve el detalle', () => {
    const ahora = new Date();
    const pendiente = compraPendiente();
    const detalle = compraService.pagar(pendiente.id, paredes, ahora);
    assert.equal(detalle.estado, CONFIRMADA);
    assert.equal(detalle.comprador.id, paredes.id);
    const guardada = compraRepository.findById(pendiente.id);
    assert.equal(guardada.estado, CONFIRMADA);
    assert.deepEqual(guardada.historial.at(-1), { estado: CONFIRMADA, usuarioId: paredes.id, fechaHora: ahora });
  });

  it('cancelar una PENDIENTE la deja CANCELADA', () => {
    const pendiente = compraPendiente();
    const compra = actualizarEstado(pendiente, partido, estadoAlCancelar(pendiente), paredes);
    assert.equal(compra.estado, CANCELADA);
    assert.equal(compraService.cancelar(pendiente.id, paredes).estado, CANCELADA);
    assert.equal(compraRepository.findById(pendiente.id).estado, CANCELADA);
  });

  it('cancelar una CONFIRMADA la deja REEMBOLSADA', () => {
    const confirmada = actualizarEstado(compraPendiente(), partido, CONFIRMADA, paredes);
    const compra = actualizarEstado(confirmada, partido, estadoAlCancelar(confirmada), paredes);
    assert.equal(compra.estado, REEMBOLSADA);
    assert.deepEqual(compra.historial.map((c) => c.estado), [PENDIENTE, CONFIRMADA, REEMBOLSADA]);

    const pendiente = compraPendiente();
    compraService.pagar(pendiente.id, paredes);
    assert.equal(compraService.cancelar(pendiente.id, paredes).estado, REEMBOLSADA);
    assert.deepEqual(compraRepository.findById(pendiente.id).historial.map((c) => c.estado), [PENDIENTE, CONFIRMADA, REEMBOLSADA]);
  });

  it('no se puede cancelar una UTILIZADA', () => {
    rechaza(() => estadoAlCancelar(seed.compras.paredesAcustico), BusinessRuleError, 'No se puede cancelar una compra UTILIZADA');
    rechaza(() => actualizarEstado(seed.compras.paredesAcustico, seed.eventos.acustico, CANCELADA, paredes),
      BusinessRuleError, 'No se puede pasar de UTILIZADA a CANCELADA');
    rechaza(() => compraService.cancelar(seed.compras.paredesAcustico.id, paredes), BusinessRuleError, 'No se puede cancelar una compra UTILIZADA');
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

    // Por el service: misma regla y queda guardada.
    const pendiente = compraPendiente();
    compraService.pagar(pendiente.id, paredes);
    rechaza(() => compraService.marcarUtilizada(pendiente.id, dilollo), BusinessRuleError, 'Todavía no es el día del evento');
    assert.equal(compraService.marcarUtilizada(pendiente.id, dilollo, inicioDelDia).estado, UTILIZADA);
    assert.equal(compraRepository.findById(pendiente.id).estado, UTILIZADA);
  });

  it('rechaza las transiciones que no están en la tabla', () => {
    rechaza(() => actualizarEstado(compraPendiente(), partido, UTILIZADA, dilollo), BusinessRuleError, 'No se puede pasar de PENDIENTE a UTILIZADA');
    rechaza(() => actualizarEstado(seed.compras.paredesRock, rock, CONFIRMADA, paredes), BusinessRuleError, 'No se puede pasar de CONFIRMADA a CONFIRMADA');
    rechaza(() => actualizarEstado(seed.compras.blancoRockReembolsada, rock, CONFIRMADA, blanco), BusinessRuleError, 'No se puede pasar de REEMBOLSADA a CONFIRMADA');
    rechaza(() => actualizarEstado(seed.compras.blancoPartidoCancelada, partido, CONFIRMADA, blanco), BusinessRuleError, 'No se puede pasar de CANCELADA a CONFIRMADA');
  });

  it('el service da 404 si la compra no existe', () => {
    assert.throws(() => compraService.pagar(9999, paredes), (err) => err.status === 404 && err.message === 'No existe la compra 9999');
  });
});

describe('comprar', () => {
  const { paredes, blanco, tomas } = seed.usuarios;
  const { rock, festival, acustico } = seed.eventos;

  function rechaza(fn, status, mensaje) {
    assert.throws(fn, (err) => err.status === status && err.message === mensaje);
  }

  it('nuevaCompra arma los datos con el total calculado, sin guardarlos', () => {
    const platea = tipo(rock, 'Platea');
    const ahora = new Date();
    const cantidadAntes = compraRepository.findByEvento(rock.id).length;
    const datos = nuevaCompra({ tipoEntradaId: platea.id, cantidad: 2 }, rock, compraRepository.findByEvento(rock.id), paredes, ahora);
    assert.deepEqual(datos, {
      compradorId: paredes.id, eventoId: rock.id, tipoEntradaId: platea.id, cantidad: 2, total: 160000, fechaHora: ahora,
    });
    assert.equal(compraRepository.findByEvento(rock.id).length, cantidadAntes);
  });

  it('crea la compra PENDIENTE con el total calculado y ocupa cupo', () => {
    const platea = tipo(rock, 'Platea');
    const antes = calcularDisponibles(platea, compraRepository.findByEvento(rock.id));
    const compra = compraService.comprar({ eventoId: rock.id, tipoEntradaId: platea.id, cantidad: 2 }, paredes);
    assert.equal(compra.estado, EstadoCompra.PENDIENTE);
    assert.equal(compra.comprador.id, paredes.id);
    assert.equal(compra.total, 160000);
    assert.equal(compraRepository.findById(compra.id).estado, EstadoCompra.PENDIENTE);
    assert.equal(calcularDisponibles(platea, compraRepository.findByEvento(rock.id)), antes - 2);
  });

  it('rechaza si no hay cupo, diciendo cuántas quedan', () => {
    rechaza(() => compraService.comprar({ eventoId: festival.id, tipoEntradaId: tipo(festival, 'Backstage').id, cantidad: 1 }, paredes),
      409, 'No hay cupo suficiente: quedan 0 entradas');
  });

  it('si queda una sola entrada, el mensaje va en singular', () => {
    const vip = tipo(festival, 'VIP');
    const disponibles = calcularDisponibles(vip, compraRepository.findByEvento(festival.id));
    compraService.comprar({ eventoId: festival.id, tipoEntradaId: vip.id, cantidad: disponibles - 1 }, blanco);
    rechaza(() => compraService.comprar({ eventoId: festival.id, tipoEntradaId: vip.id, cantidad: 2 }, paredes),
      409, 'No hay cupo suficiente: queda 1 entrada');
  });

  it('rechaza un evento o tipo de entrada inexistente', () => {
    rechaza(() => compraService.comprar({ eventoId: 99, tipoEntradaId: 1, cantidad: 1 }, paredes), 400, 'No existe el evento 99');
    rechaza(() => compraService.comprar({ eventoId: rock.id, tipoEntradaId: 9, cantidad: 1 }, paredes), 400, 'El evento no tiene el tipo de entrada 9');
  });

  it('rechaza un evento pasado y que el organizador compre en su evento', () => {
    rechaza(() => compraService.comprar({ eventoId: acustico.id, tipoEntradaId: 1, cantidad: 1 }, blanco), 409, 'El evento ya se realizó');
    rechaza(() => compraService.comprar({ eventoId: rock.id, tipoEntradaId: 1, cantidad: 1 }, tomas), 409, 'No podés comprar entradas de un evento que organizás');
  });

  it('detalleCompra reemplaza los ids por resúmenes', () => {
    const detalle = detalleCompra(seed.compras.paredesRock, rock, paredes, tomas);
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

    // verCompra aplica la misma regla.
    assert.equal(compraService.verCompra(paredesRock.id, tomas).id, paredesRock.id);
    assert.throws(() => compraService.verCompra(paredesRock.id, blanco),
      (err) => err instanceof ForbiddenError && err.message === 'No podés ver esta compra');
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
    assert.equal(detalleCompra(paredesRock, rock, seed.usuarios.paredes, seed.usuarios.tomas).diasRestantes, 20);
  });
});

describe('ventas del organizador', () => {
  it('resumenVentas cuenta las entradas que ocupan cupo y suma lo cobrado', () => {
    const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;
    const compras = [
      { estado: PENDIENTE, cantidad: 2, total: 200 },
      { estado: CONFIRMADA, cantidad: 1, total: 100 },
      { estado: UTILIZADA, cantidad: 3, total: 300 },
      { estado: CANCELADA, cantidad: 5, total: 500 },
      { estado: REEMBOLSADA, cantidad: 4, total: 400 },
    ];
    // Vendidas: pendiente, confirmada y utilizada (2 + 1 + 3). Cobrado: confirmada y utilizada.
    assert.deepEqual(resumenVentas(compras), { vendidas: 6, recaudado: 400 });
    assert.deepEqual(resumenVentas([]), { vendidas: 0, recaudado: 0 });
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
  const usuarios = new Map(Object.values(seed.usuarios).map((usuario) => [usuario.id, usuario]));

  it('mensajesConAutor agrega el nombre de quien escribió cada mensaje', () => {
    const mensajes = mensajesConAutor(seed.compras.paredesRock.mensajes, usuarios);
    assert.deepEqual(mensajes.map((m) => [m.autor.nombre, m.mensaje]), [
      ['Leandro', '¿Se puede entrar con mochila?'],
      ['Tomas', 'Sí, la revisan en la puerta.'],
    ]);
    assert.equal(mensajes[0].usuarioId, undefined);
    assert.deepEqual(compraService.mensajesDe(seed.compras.paredesRock.id, paredes), mensajes);
  });

  it('solo el comprador y el organizador ven el chat', () => {
    assert.throws(() => compraService.mensajesDe(seed.compras.paredesRock.id, dilollo),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el comprador y el organizador pueden ver este chat');
  });

  it('enviarMensaje del dominio suma el mensaje sin guardarlo', () => {
    const compra = seed.compras.paredesAcustico;
    const ahora = new Date();
    const actualizada = enviarMensaje(compra, acustico, tomas, 'Hola', ahora);
    assert.deepEqual(actualizada.mensajes.at(-1), { usuarioId: tomas.id, mensaje: 'Hola', enviado: ahora });
    assert.equal(compraRepository.findById(compra.id).mensajes.length, compra.mensajes.length);
  });

  it('comprador y organizador escriben en cualquier estado, incluso con el evento pasado', () => {
    const compra = seed.compras.paredesAcustico; // UTILIZADA, evento pasado
    const ahora = new Date();
    const mensaje = compraService.enviarMensaje(compra.id, tomas, '¡Gracias por venir!', ahora);
    assert.deepEqual(mensaje, { autor: { id: tomas.id, nombre: 'Tomas', apellido: 'Goldszmidt' }, mensaje: '¡Gracias por venir!', enviado: ahora });
    compraService.enviarMensaje(compra.id, paredes, 'A ustedes');
    assert.deepEqual(compraRepository.findById(compra.id).mensajes.map((m) => m.mensaje), ['¡Gracias por venir!', 'A ustedes']);
  });

  it('nadie más puede escribir', () => {
    assert.throws(() => enviarMensaje(seed.compras.paredesAcustico, acustico, dilollo, 'hola'),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el comprador y el organizador pueden escribir en este chat');
    assert.throws(() => compraService.enviarMensaje(seed.compras.paredesAcustico.id, dilollo, 'hola'),
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
    const { blancoRockReembolsada } = seed.compras;
    const ahora = new Date();
    // El dominio devuelve la compra leída sin guardarla.
    const compra = leerMensajes(compraRepository.findById(blancoRockReembolsada.id), rock, tomas, ahora);
    assert.equal(mensajesNoLeidos(compra, rock, tomas), 0);
    assert.deepEqual(compra.mensajesLeidosHasta.comprador, blancoRockReembolsada.mensajesLeidosHasta.comprador);
    assert.equal(cantidadConMensajesNoLeidos(compraRepository.findByEvento(rock.id), rock, tomas), 1);
    assert.throws(() => leerMensajes(compra, rock, dilollo),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el comprador y el organizador pueden leer este chat');

    // El service lo guarda.
    compraService.leerMensajes(blancoRockReembolsada.id, tomas, ahora);
    assert.deepEqual(compraRepository.findById(blancoRockReembolsada.id).mensajesLeidosHasta, compra.mensajesLeidosHasta);
    assert.equal(cantidadConMensajesNoLeidos(compraRepository.findByEvento(rock.id), rock, tomas), 0);
    assert.throws(() => compraService.leerMensajes(blancoRockReembolsada.id, dilollo),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el comprador y el organizador pueden leer este chat');
  });

  it('quien escribe ya leyó su chat; el otro tiene un mensaje nuevo', () => {
    const { obra } = seed.eventos;
    const compra = seed.compras.paredesObra; // sin mensajes
    const enMemoria = enviarMensaje(compra, obra, paredes, '¿Hay estacionamiento?');
    assert.equal(mensajesNoLeidos(enMemoria, obra, paredes), 0);
    assert.equal(mensajesNoLeidos(enMemoria, obra, tomas), 1);

    compraService.enviarMensaje(compra.id, paredes, '¿Hay estacionamiento?');
    const actualizada = compraRepository.findById(compra.id);
    assert.equal(mensajesNoLeidos(actualizada, obra, paredes), 0);
    assert.equal(mensajesNoLeidos(actualizada, obra, tomas), 1);
  });

  it('detalleCompra suma mensajesNoLeidos para quien pide y no muestra hasta cuándo leyó cada uno', () => {
    const { paredesRock } = seed.compras;
    const detalle = detalleCompra(paredesRock, seed.eventos.rock, paredes, tomas, paredes);
    assert.equal(detalle.mensajesNoLeidos, 1);
    assert.equal(detalle.mensajesLeidosHasta, undefined);
    assert.equal(detalleCompra(paredesRock, seed.eventos.rock, paredes, tomas).mensajesNoLeidos, undefined);
  });

  it('requireString respeta maxLength', () => {
    assert.equal(requireString('  hola  ', 'mensaje', { maxLength: 4 }), 'hola');
    assert.throws(() => requireString('a'.repeat(501), 'mensaje', { maxLength: 500 }),
      (err) => err.status === 400 && err.message === 'El campo mensaje puede tener como máximo 500 caracteres');
  });
});
