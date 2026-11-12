import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import { marcarLeida, marcarLeidas, notificacionesDe } from '../src/domain/notificacion.js';
import { enviarMensaje, leerMensajes } from '../src/domain/compra.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import { ForbiddenError, NotFoundError } from '../src/http/errors.js';

const seed = loadSeed();
const { lucia, martin, sofia, juan } = seed.usuarios;
const nuevas = (lista) => lista.filter((n) => !n.leida);

describe('notificaciones', () => {
  it('Lucía (organizadora) arranca con 4 nuevas: dos mensajes de Juan, su reembolso y la compra de Sofía', () => {
    const lista = notificacionesDe(lucia, lucia.id);
    assert.deepEqual(
      nuevas(lista).map((n) => [n.tipo, n.estado ?? null, n.de.nombre, n.evento.nombre]),
      [
        ['MENSAJE', null, 'Juan', 'Festival de Verano'],
        ['COMPRA', 'PENDIENTE', 'Sofía', 'La casa de Bernarda Alba'],
        ['MENSAJE', null, 'Juan', 'Noche de Rock Nacional'],
        ['CAMBIO_ESTADO', 'REEMBOLSADA', 'Juan', 'Noche de Rock Nacional'],
      ],
    );
  });

  it('van primero las nuevas, cada grupo de la más reciente a la más vieja, e incluyen las reseñas', () => {
    const lista = notificacionesDe(lucia, lucia.id);
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
    for (const usuario of [lucia, martin, sofia, juan]) {
      assert.ok(notificacionesDe(usuario, usuario.id).every((n) => n.de.id !== usuario.id));
    }
  });

  it('el comprador ve los mensajes y los cambios del organizador', () => {
    const lista = notificacionesDe(sofia, sofia.id);
    assert.deepEqual(nuevas(lista).map((n) => [n.tipo, n.de.nombre, n.mensaje]), [
      ['MENSAJE', 'Lucía', 'Sí, chica, la revisan en la puerta.'],
    ]);
    assert.ok(lista.some((n) => n.tipo === 'CAMBIO_ESTADO' && n.estado === 'UTILIZADA' && n.de.nombre === 'Martín'));
    assert.equal(nuevas(notificacionesDe(juan, juan.id)).length, 0);
    assert.equal(nuevas(notificacionesDe(martin, martin.id)).length, 2);
  });

  it('al abrir una, solo esa queda leída', () => {
    const [primera, segunda] = nuevas(notificacionesDe(martin, martin.id));
    marcarLeida(martin, martin.id, primera.id);
    assert.deepEqual(nuevas(notificacionesDe(martin, martin.id)).map((n) => n.id), [segunda.id]);
    marcarLeida(martin, martin.id, primera.id); // otra vez: no cambia nada
    assert.equal(nuevas(notificacionesDe(martin, martin.id)).length, 1);
  });

  it('una notificación que no es del usuario da 404', () => {
    assert.throws(() => marcarLeida(martin, martin.id, 'compra-999-mensaje-0'), NotFoundError);
    assert.throws(() => marcarLeida(juan, lucia.id, 'compra-1-estado-0'), ForbiddenError);
  });

  it('al abrir el chat quedan leídas las notificaciones de sus mensajes', () => {
    const lista = notificacionesDe(sofia, sofia.id);
    const compraId = lista.find((n) => n.tipo === 'MENSAJE' && !n.leida).compra.id;
    leerMensajes(compraRepository.findById(compraId), seed.eventos.rock, sofia);
    assert.equal(nuevas(notificacionesDe(sofia, sofia.id)).length, 0);
  });

  it('al marcarlas como leídas quedan en 0, y lo que llega después vuelve a ser nuevo', () => {
    const ahora = new Date();
    marcarLeidas(lucia, lucia.id, ahora);
    assert.equal(nuevas(notificacionesDe(lucia, lucia.id)).length, 0);

    const compra = compraRepository.findById(seed.compras.juanBackstage.id);
    const despues = new Date(ahora.getTime() + 1000);
    enviarMensaje(compra, seed.eventos.festival, juan, 'Gracias igual', despues);
    assert.deepEqual(nuevas(notificacionesDe(lucia, lucia.id)).map((n) => n.mensaje), ['Gracias igual']);
  });

  it('solo el propio usuario', () => {
    assert.throws(() => notificacionesDe(juan, lucia.id), ForbiddenError);
    assert.throws(() => marcarLeidas(juan, lucia.id), ForbiddenError);
  });
});
