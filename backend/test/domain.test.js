import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import { calcularDisponibles, hayCupoPara } from '../src/domain/tipoEntrada.js';
import { tuPrecioEstaEntre, crearEvento, detalleEvento } from '../src/domain/evento.js';
import * as eventoRepository from '../src/persistence/repositories/eventoRepository.js';
import { actualizarEstado, estadoAlCancelar } from '../src/domain/compra.js';
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
    const detalle = detalleEvento(festival, compraRepository.findByEvento(festival.id), seed.categorias.festivales, seed.usuarios.lucia);
    assert.equal(detalle.categoriaId, undefined);
    assert.equal(detalle.organizadorId, undefined);
    assert.deepEqual(detalle.categoria, { id: seed.categorias.festivales.id, nombre: 'Festivales' });
    assert.deepEqual(detalle.organizador, { id: seed.usuarios.lucia.id, nombre: 'Lucía', apellido: 'Fernández' });
    assert.deepEqual(detalle.tiposEntrada.map((t) => [t.nombre, t.disponibles]), [['General', 1000], ['VIP', 100], ['Backstage', 0]]);
  });
});
