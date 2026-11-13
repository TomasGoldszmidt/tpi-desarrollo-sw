import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import { marcarLeida, marcarLeidas, notificacionesDe } from '../src/domain/notificacion.js';
import { enviarMensaje, leerMensajes } from '../src/domain/compra.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import { ForbiddenError, NotFoundError } from '../src/http/errors.js';

const seed = loadSeed();
const { tomas, dilollo, paredes, blanco } = seed.usuarios;
const nuevas = (lista) => lista.filter((n) => !n.leida);

describe('notificaciones', () => {
  it('Tomas (organizador) arranca con 4 nuevas: dos mensajes de Blanco, su reembolso y la compra de Paredes', () => {
    const lista = notificacionesDe(tomas, tomas.id);
    assert.deepEqual(
      nuevas(lista).map((n) => [n.tipo, n.estado ?? null, n.de.nombre, n.evento.nombre]),
      [
        ['MENSAJE', null, 'Lautaro', 'Festival de Verano'],
        ['COMPRA', 'PENDIENTE', 'Leandro', 'La casa de Bernarda Alba'],
        ['MENSAJE', null, 'Lautaro', 'Noche de Rock Nacional'],
        ['CAMBIO_ESTADO', 'REEMBOLSADA', 'Lautaro', 'Noche de Rock Nacional'],
      ],
    );
  });

  it('van primero las nuevas, cada grupo de la más reciente a la más vieja, e incluyen las reseñas', () => {
    const lista = notificacionesDe(tomas, tomas.id);
    const cantidadNuevas = nuevas(lista).length;
    assert.ok(lista.slice(0, cantidadNuevas).every((n) => !n.leida));
    assert.ok(lista.slice(cantidadNuevas).every((n) => n.leida));
    for (const grupo of [lista.slice(0, cantidadNuevas), lista.slice(cantidadNuevas)]) {
      const fechas = grupo.map((n) => n.fecha.getTime());
      assert.deepEqual(fechas, [...fechas].sort((a, b) => b - a));
    }
    assert.equal(lista.filter((n) => n.tipo === 'RESENIA').length, 14);
  });

  it('no incluyen lo que hizo el propio usuario', () => {
    for (const usuario of [tomas, dilollo, paredes, blanco]) {
      assert.ok(notificacionesDe(usuario, usuario.id).every((n) => n.de.id !== usuario.id));
    }
  });

  it('el comprador ve los mensajes y los cambios del organizador', () => {
    const lista = notificacionesDe(paredes, paredes.id);
    assert.deepEqual(nuevas(lista).map((n) => [n.tipo, n.de.nombre, n.mensaje]), [
      ['MENSAJE', 'Tomas', 'Sí, la revisan en la puerta.'],
    ]);
    assert.ok(lista.some((n) => n.tipo === 'CAMBIO_ESTADO' && n.estado === 'UTILIZADA' && n.de.nombre === 'Lautaro'));
    assert.equal(nuevas(notificacionesDe(blanco, blanco.id)).length, 0);
    assert.equal(nuevas(notificacionesDe(dilollo, dilollo.id)).length, 2);
  });

  it('al abrir una, solo esa queda leída', () => {
    const [primera, segunda] = nuevas(notificacionesDe(dilollo, dilollo.id));
    marcarLeida(dilollo, dilollo.id, primera.id);
    assert.deepEqual(nuevas(notificacionesDe(dilollo, dilollo.id)).map((n) => n.id), [segunda.id]);
    marcarLeida(dilollo, dilollo.id, primera.id); // otra vez: no cambia nada
    assert.equal(nuevas(notificacionesDe(dilollo, dilollo.id)).length, 1);
  });

  it('una notificación que no es del usuario da 404', () => {
    assert.throws(() => marcarLeida(dilollo, dilollo.id, 'compra-999-mensaje-0'), NotFoundError);
    assert.throws(() => marcarLeida(blanco, tomas.id, 'compra-1-estado-0'), ForbiddenError);
  });

  it('al abrir el chat quedan leídas las notificaciones de sus mensajes', () => {
    const lista = notificacionesDe(paredes, paredes.id);
    const compraId = lista.find((n) => n.tipo === 'MENSAJE' && !n.leida).compra.id;
    leerMensajes(compraRepository.findById(compraId), seed.eventos.rock, paredes);
    assert.equal(nuevas(notificacionesDe(paredes, paredes.id)).length, 0);
  });

  it('al marcarlas como leídas quedan en 0, y lo que llega después vuelve a ser nuevo', () => {
    const ahora = new Date();
    marcarLeidas(tomas, tomas.id, ahora);
    assert.equal(nuevas(notificacionesDe(tomas, tomas.id)).length, 0);

    const compra = compraRepository.findById(seed.compras.blancoBackstage.id);
    const despues = new Date(ahora.getTime() + 1000);
    enviarMensaje(compra, seed.eventos.festival, blanco, 'Gracias igual', despues);
    assert.deepEqual(nuevas(notificacionesDe(tomas, tomas.id)).map((n) => n.mensaje), ['Gracias igual']);
  });

  it('solo el propio usuario', () => {
    assert.throws(() => notificacionesDe(blanco, tomas.id), ForbiddenError);
    assert.throws(() => marcarLeidas(blanco, tomas.id), ForbiddenError);
  });
});
