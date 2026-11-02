import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import { calcularDisponibles, hayCupoPara } from '../src/domain/tipoEntrada.js';
import { tuPrecioEstaEntre } from '../src/domain/evento.js';

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
