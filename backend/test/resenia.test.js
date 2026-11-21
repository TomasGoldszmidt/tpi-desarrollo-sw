import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as reseniaRepository from '../src/persistence/repositories/reseniaRepository.js';
import * as eventoRepository from '../src/persistence/repositories/eventoRepository.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import * as usuarioRepository from '../src/persistence/repositories/usuarioRepository.js';
import {
  calcularPuntajes, nuevaResenia, perfilUsuario, puntajeDe, reseniasDeOrganizador, resumenResenia,
} from '../src/domain/resenia.js';
import * as reseniaService from '../src/services/reseniaService.js';

// Se usa el seed real: los casos borde (compras canceladas, organizadores sin reseñas) ya están ahí.
const seed = loadSeed();

function rechaza(fn, status, mensaje) {
  assert.throws(fn, (err) => err.status === status && err.message === mensaje);
}

describe('puntaje del organizador', () => {
  const { tomas, dilollo } = seed.usuarios;

  it('promedia las reseñas de los eventos de cada organizador', () => {
    const puntajes = calcularPuntajes(eventoRepository.findAll(), reseniaRepository.findAll());
    assert.deepEqual(puntajes.get(tomas.id), { puntaje: 4.5, cantidadResenias: 14 });
    assert.equal(puntajes.has(dilollo.id), false); // sin reseñas
  });

  it('puntajeDe y perfilUsuario dan null y 0 a quien no tiene reseñas', () => {
    const puntajes = reseniaService.puntajesDeOrganizadores();
    assert.deepEqual(puntajeDe(tomas, puntajes), { puntaje: 4.5, cantidadResenias: 14 });
    assert.deepEqual(puntajeDe(dilollo, puntajes), { puntaje: null, cantidadResenias: 0 });
    assert.deepEqual(perfilUsuario(dilollo, puntajes), { ...dilollo, puntaje: null, cantidadResenias: 0 });
  });

  it('perfilDe trae el usuario con su puntaje, o 404 si no existe', () => {
    const usuario = usuarioRepository.findById(tomas.id);
    assert.deepEqual(reseniaService.perfilDe(tomas.id), { ...usuario, puntaje: 4.5, cantidadResenias: 14 });
    rechaza(() => reseniaService.perfilDe(999), 404, 'No existe el usuario 999');
  });
});

describe('reseñas', () => {
  const { paredes, blanco, tomas, dilollo } = seed.usuarios;
  const { standup, acustico } = seed.eventos;

  it('reseniasDeOrganizador trae las de sus eventos con comprador y evento', () => {
    // Del evento más reciente al más viejo: primero el acústico y después los eventos viejos del seed.
    const eventos = new Map(eventoRepository.findByOrganizador(tomas.id).map((e) => [e.id, e]));
    const usuarios = new Map(usuarioRepository.findAll().map((u) => [u.id, u]));
    const resenias = reseniasDeOrganizador(reseniaRepository.findByEventos([...eventos.keys()]), eventos, usuarios);
    assert.equal(resenias.length, 14);
    assert.deepEqual(resenias.slice(0, 3).map((r) => [r.comprador.nombre, r.evento.nombre, r.puntuacion]), [
      ['Lautaro', 'Acústico en el Gran Rex', 4],
      ['Leandro', 'Acústico en el Gran Rex', 5],
      ['Lautaro', 'Recital de Cuarteto', 5],
    ]);
    assert.deepEqual(reseniaService.reseniasDe(tomas.id), resenias);
  });

  it('reseniasDe da 404 si el organizador no existe', () => {
    rechaza(() => reseniaService.reseniasDe(999), 404, 'No existe el usuario 999');
  });

  it('resumenResenia y reseniaDeCompra traen la reseña del comprador para ese evento, o null', () => {
    const { paredesAcustico } = seed.resenias;
    const esperado = { id: paredesAcustico.id, puntuacion: 5, detalle: paredesAcustico.detalle };
    assert.deepEqual(resumenResenia(paredesAcustico), esperado);
    assert.equal(resumenResenia(null), null);
    assert.deepEqual(reseniaService.reseniaDeCompra(seed.compras.paredesAcustico), esperado);
    assert.equal(reseniaService.reseniaDeCompra(seed.compras.paredesStandup), null);
  });

  it('nuevaResenia arma los datos sin guardar si asistió y no reseñó', () => {
    const datos = nuevaResenia({ puntuacion: 4, detalle: 'Bien' }, standup, compraRepository.findByComprador(paredes.id), null, paredes);
    assert.deepEqual(datos, { compradorId: paredes.id, eventoId: standup.id, detalle: 'Bien', puntuacion: 4 });
    assert.equal(reseniaRepository.findByCompradorAndEvento(paredes.id, standup.id), null);
  });

  it('nuevaResenia rechaza a quien no asistió o ya reseñó', () => {
    const asistio = 'Solo podés reseñar eventos a los que asististe';
    rechaza(() => nuevaResenia({ puntuacion: 3, detalle: 'x' }, standup, compraRepository.findByComprador(blanco.id), null, blanco), 409, asistio); // CONFIRMADA
    rechaza(() => nuevaResenia({ puntuacion: 3, detalle: 'x' }, acustico, [], null, dilollo), 409, asistio); // sin compra
    rechaza(() => nuevaResenia({ puntuacion: 3, detalle: 'x' }, acustico, compraRepository.findByComprador(paredes.id),
      seed.resenias.paredesAcustico, paredes), 409, 'Ya reseñaste este evento');
  });

  it('quien usó su entrada puede reseñar, una sola vez', () => {
    const resenia = reseniaService.crearResenia({ eventoId: standup.id, puntuacion: 4, detalle: 'Muy divertido' }, paredes);
    assert.equal(reseniaService.reseniaDeCompra(seed.compras.paredesStandup).id, resenia.id);
    assert.deepEqual(resenia.comprador, { id: paredes.id, nombre: 'Leandro', apellido: 'Paredes' });
    assert.deepEqual(resenia.evento, { id: standup.id, nombre: standup.nombre, fecha: standup.fecha });
    assert.equal(reseniaService.reseniasDe(dilollo.id).some((r) => r.id === resenia.id), true);
    rechaza(() => reseniaService.crearResenia({ eventoId: standup.id, puntuacion: 5, detalle: 'Otra vez' }, paredes), 409, 'Ya reseñaste este evento');
  });

  it('no puede reseñar quien no tiene la compra UTILIZADA', () => {
    const asistio = 'Solo podés reseñar eventos a los que asististe';
    rechaza(() => reseniaService.crearResenia({ eventoId: standup.id, puntuacion: 3, detalle: 'x' }, blanco), 409, asistio); // CONFIRMADA
    rechaza(() => reseniaService.crearResenia({ eventoId: acustico.id, puntuacion: 3, detalle: 'x' }, dilollo), 409, asistio); // sin compra
  });

  it('rechaza un evento inexistente', () => {
    rechaza(() => reseniaService.crearResenia({ eventoId: 99, puntuacion: 3, detalle: 'x' }, paredes), 400, 'No existe el evento 99');
  });

  it('listarReseniasDe pagina las reseñas del organizador', () => {
    const pagina = reseniaService.listarReseniasDe(tomas.id, { pagina: 1, limite: 2 });
    assert.equal(pagina.resultados.length, 2);
    assert.equal(pagina.hayMas, true);
    assert.deepEqual(pagina.resultados, reseniaService.reseniasDe(tomas.id).slice(0, 2));
  });
});
