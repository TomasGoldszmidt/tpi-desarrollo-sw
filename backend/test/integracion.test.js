import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import { createApp } from '../src/app.js';

// Tests de integración: levantan la app con el seed y recorren los flujos principales por HTTP,
// pasando por todas las capas (rutas, controladores, services, dominio y repositorios).
// Cada archivo de test corre en su propio proceso, así que este seed es solo de este archivo.
const seed = loadSeed();
const { tomas, dilollo, paredes, blanco } = seed.usuarios;
const { partido, standup, rock } = seed.eventos;

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

/** @returns {Promise<{ status: number, headers: Headers, body: any }>} */
async function pedir(metodo, ruta, { usuario, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (usuario) headers['X-User-Id'] = String(usuario.id);
  const res = await fetch(base + ruta, { method: metodo, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const texto = await res.text();
  return { status: res.status, headers: res.headers, body: texto ? JSON.parse(texto) : null };
}

const disponiblesDe = async (eventoId, tipoNombre) =>
  (await pedir('GET', `/eventos/${eventoId}`)).body.tiposEntrada.find((t) => t.nombre === tipoNombre).disponibles;

describe('flujo de compra: comprar, pagar, chatear y cancelar', () => {
  it('inicia sesión, busca el evento y lo encuentra en el catálogo', async () => {
    const sesion = await pedir('POST', '/sesiones', { body: { email: 'paredes@gmail.com', contrasenia: 'paredes1234' } });
    assert.equal(sesion.status, 200);
    assert.equal(sesion.body.id, paredes.id);

    const catalogo = await pedir('GET', '/eventos?texto=gimnasia');
    assert.equal(catalogo.status, 200);
    assert.deepEqual(catalogo.body.resultados.map((e) => e.id), [partido.id]);
  });

  let compraId;

  it('compra: queda PENDIENTE, con Location, y descuenta el cupo', async () => {
    const antes = await disponiblesDe(partido.id, 'Platea');
    const res = await pedir('POST', '/compras', { usuario: paredes, body: { eventoId: partido.id, tipoEntradaId: 2, cantidad: 3 } });
    assert.equal(res.status, 201);
    compraId = res.body.id;
    assert.equal(res.headers.get('location'), `/compras/${compraId}`);
    assert.equal(res.body.estado, 'PENDIENTE');
    assert.equal(res.body.total, 120000);
    assert.deepEqual(res.body.comprador, { id: paredes.id, nombre: 'Leandro', apellido: 'Paredes' });
    assert.equal(res.body.resenia, null);
    assert.equal(await disponiblesDe(partido.id, 'Platea'), antes - 3);
  });

  it('el organizador la ve en sus ventas, pero las ventas no las ve nadie más', async () => {
    const ventas = await pedir('GET', `/eventos/${partido.id}/compras`, { usuario: dilollo });
    assert.equal(ventas.status, 200);
    assert.equal(ventas.body.resultados[0].id, compraId);
    assert.deepEqual(ventas.body.resumen, { vendidas: 3, recaudado: 0 });
    assert.equal((await pedir('GET', `/eventos/${partido.id}/compras`, { usuario: blanco })).status, 403);
  });

  it('paga: pasa a CONFIRMADA, con días restantes, y suma a lo recaudado', async () => {
    assert.equal((await pedir('POST', `/compras/${compraId}/pago`, { usuario: blanco })).status, 403);
    const res = await pedir('POST', `/compras/${compraId}/pago`, { usuario: paredes });
    assert.equal(res.status, 200);
    assert.equal(res.body.estado, 'CONFIRMADA');
    assert.deepEqual(res.body.historial.map((c) => c.estado), ['PENDIENTE', 'CONFIRMADA']);
    assert.equal(typeof res.body.diasRestantes, 'number');

    const otraVez = await pedir('POST', `/compras/${compraId}/pago`, { usuario: paredes });
    assert.equal(otraVez.status, 409);
    assert.deepEqual(otraVez.body, { error: 'No se puede pasar de CONFIRMADA a CONFIRMADA' });

    const ventas = await pedir('GET', `/eventos/${partido.id}/compras`, { usuario: dilollo });
    assert.deepEqual(ventas.body.resumen, { vendidas: 3, recaudado: 120000 });
  });

  it('aparece en Mis compras del comprador, en las confirmadas', async () => {
    const res = await pedir('GET', '/compras?estado=CONFIRMADA', { usuario: paredes });
    assert.equal(res.status, 200);
    assert.ok(res.body.resultados.some((c) => c.id === compraId));
    assert.ok(res.body.resultados.every((c) => c.estado === 'CONFIRMADA'));
    assert.ok(res.body.cantidades.todas >= res.body.cantidades.CONFIRMADA);
  });

  it('chat: el comprador escribe y al organizador le llega como no leído y como notificación', async () => {
    const enviado = await pedir('POST', `/compras/${compraId}/mensajes`, { usuario: paredes, body: { mensaje: '¿Hay estacionamiento?' } });
    assert.equal(enviado.status, 201);
    assert.deepEqual(enviado.body.autor, { id: paredes.id, nombre: 'Leandro', apellido: 'Paredes' });

    assert.equal((await pedir('POST', `/compras/${compraId}/mensajes`, { usuario: blanco, body: { mensaje: 'hola' } })).status, 403);

    const detalle = await pedir('GET', `/compras/${compraId}`, { usuario: dilollo });
    assert.equal(detalle.body.mensajesNoLeidos, 1);
    assert.equal((await pedir('GET', `/compras/${compraId}`, { usuario: paredes })).body.mensajesNoLeidos, 0);

    const misEventos = await pedir('GET', `/usuarios/${dilollo.id}/eventos?filtro=conMensajesNuevos`);
    assert.deepEqual(misEventos.body.resultados.map((e) => [e.id, e.conMensajesNoLeidos]), [[partido.id, 1]]);

    const notificaciones = await pedir('GET', `/usuarios/${dilollo.id}/notificaciones`, { usuario: dilollo });
    assert.ok(notificaciones.body.resultados.some((n) => n.tipo === 'MENSAJE' && !n.leida && n.mensaje === '¿Hay estacionamiento?'));
  });

  it('chat: el organizador lo abre, responde y queda todo leído de su lado', async () => {
    assert.equal((await pedir('PUT', `/compras/${compraId}/mensajes/lectura`, { usuario: dilollo })).status, 204);
    assert.equal((await pedir('GET', `/compras/${compraId}`, { usuario: dilollo })).body.mensajesNoLeidos, 0);

    await pedir('POST', `/compras/${compraId}/mensajes`, { usuario: dilollo, body: { mensaje: 'Sí, en la esquina.' } });
    const chat = await pedir('GET', `/compras/${compraId}/mensajes`, { usuario: paredes });
    assert.deepEqual(chat.body.map((m) => [m.autor.nombre, m.mensaje]), [
      ['Leandro', '¿Hay estacionamiento?'],
      ['Lautaro', 'Sí, en la esquina.'],
    ]);
    assert.equal((await pedir('GET', `/compras/${compraId}`, { usuario: paredes })).body.mensajesNoLeidos, 1);
  });

  it('cancela una pagada: queda REEMBOLSADA y libera el cupo', async () => {
    const antes = await disponiblesDe(partido.id, 'Platea');
    const res = await pedir('POST', `/compras/${compraId}/cancelacion`, { usuario: paredes });
    assert.equal(res.status, 200);
    assert.equal(res.body.estado, 'REEMBOLSADA');
    assert.equal(await disponiblesDe(partido.id, 'Platea'), antes + 3);
    assert.equal((await pedir('POST', `/compras/${compraId}/cancelacion`, { usuario: paredes })).status, 409);
  });

  it('cancela una pendiente: queda CANCELADA', async () => {
    const creada = await pedir('POST', '/compras', { usuario: blanco, body: { eventoId: partido.id, tipoEntradaId: 1, cantidad: 1 } });
    const res = await pedir('POST', `/compras/${creada.body.id}/cancelacion`, { usuario: blanco });
    assert.equal(res.body.estado, 'CANCELADA');
  });

  it('rechaza comprar sin cupo, en un evento pasado o en uno propio', async () => {
    const sinCupo = await pedir('POST', '/compras', { usuario: paredes, body: { eventoId: partido.id, tipoEntradaId: 2, cantidad: 10000 } });
    assert.equal(sinCupo.status, 409);
    assert.match(sinCupo.body.error, /^No hay cupo suficiente: quedan \d+ entradas$/);
    assert.equal((await pedir('POST', '/compras', { usuario: paredes, body: { eventoId: standup.id, tipoEntradaId: 1, cantidad: 1 } })).status, 409);
    assert.equal((await pedir('POST', '/compras', { usuario: dilollo, body: { eventoId: partido.id, tipoEntradaId: 1, cantidad: 1 } })).status, 409);
    assert.equal((await pedir('POST', '/compras', { usuario: paredes, body: { eventoId: 999, tipoEntradaId: 1, cantidad: 1 } })).status, 400);
  });
});

describe('flujo del organizador: crear un evento y venderlo', () => {
  const enUnMes = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const datos = {
    nombre: 'Charla de integración', descripcion: 'Probando de punta a punta', lugar: 'Aula Magna',
    categoriaId: seed.categorias.conferencias.id, fecha: enUnMes.toISOString(),
    tiposEntrada: [{ nombre: 'General', descripcion: 'Sin ubicación', precio: 500, cupo: 2 }],
  };
  let eventoId;

  it('crea el evento con 201 y Location, y queda como organizador', async () => {
    const res = await pedir('POST', '/eventos', { usuario: blanco, body: datos });
    assert.equal(res.status, 201);
    eventoId = res.body.id;
    assert.equal(res.headers.get('location'), `/eventos/${eventoId}`);
    assert.equal(res.body.organizador.id, blanco.id);
    assert.deepEqual(res.body.tiposEntrada.map((t) => [t.nombre, t.disponibles]), [['General', 2]]);
  });

  it('aparece en el catálogo, en su categoría y en Mis eventos', async () => {
    const catalogo = await pedir('GET', `/eventos?categoriaId=${seed.categorias.conferencias.id}`);
    assert.deepEqual(catalogo.body.resultados.map((e) => e.id), [eventoId]);
    const misEventos = await pedir('GET', `/usuarios/${blanco.id}/eventos?filtro=proximos`);
    assert.ok(misEventos.body.resultados.some((e) => e.id === eventoId));
    assert.equal(misEventos.body.cantidades.proximos, misEventos.body.total);
  });

  it('se agota con dos entradas y la tercera se rechaza', async () => {
    await pedir('POST', '/compras', { usuario: paredes, body: { eventoId, tipoEntradaId: 1, cantidad: 2 } });
    const res = await pedir('POST', '/compras', { usuario: tomas, body: { eventoId, tipoEntradaId: 1, cantidad: 1 } });
    assert.deepEqual(res.body, { error: 'No hay cupo suficiente: quedan 0 entradas' });
    assert.equal(await disponiblesDe(eventoId, 'General'), 0);
  });

  it('valida los datos y las reglas al crear', async () => {
    assert.equal((await pedir('POST', '/eventos', { usuario: blanco, body: { ...datos, nombre: '' } })).status, 400);
    assert.equal((await pedir('POST', '/eventos', { usuario: blanco, body: { ...datos, categoriaId: 99 } })).status, 400);
    assert.equal((await pedir('POST', '/eventos', { usuario: blanco, body: { ...datos, fecha: '2020-01-01T00:00:00.000Z' } })).status, 409);
    assert.equal((await pedir('POST', '/eventos', { body: datos })).status, 401);
  });
});

describe('flujo de reseña: asistir, reseñar y cambiar el puntaje del organizador', () => {
  it('Dilollo arranca sin puntaje', async () => {
    const res = await pedir('GET', `/usuarios/${dilollo.id}`);
    assert.deepEqual([res.body.puntaje, res.body.cantidadResenias], [null, 0]);
  });

  it('quien usó la entrada reseña una vez, y el puntaje se actualiza', async () => {
    const res = await pedir('POST', '/resenias', { usuario: paredes, body: { eventoId: standup.id, puntuacion: 4, detalle: 'Muy divertido' } });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.comprador, { id: paredes.id, nombre: 'Leandro', apellido: 'Paredes' });

    const perfil = await pedir('GET', `/usuarios/${dilollo.id}`);
    assert.deepEqual([perfil.body.puntaje, perfil.body.cantidadResenias], [4, 1]);
    const resenias = await pedir('GET', `/usuarios/${dilollo.id}/resenias`);
    assert.deepEqual(resenias.body.resultados.map((r) => r.id), [res.body.id]);
    const evento = await pedir('GET', `/eventos/${standup.id}`);
    assert.equal(evento.body.organizador.puntaje, 4);

    const compra = (await pedir('GET', '/compras?estado=UTILIZADA', { usuario: paredes })).body.resultados
      .find((c) => c.evento.id === standup.id);
    assert.deepEqual(compra.resenia, { id: res.body.id, puntuacion: 4, detalle: 'Muy divertido' });

    const otra = await pedir('POST', '/resenias', { usuario: paredes, body: { eventoId: standup.id, puntuacion: 5, detalle: 'Otra' } });
    assert.deepEqual(otra.body, { error: 'Ya reseñaste este evento' });
  });

  it('no reseña quien no asistió', async () => {
    const res = await pedir('POST', '/resenias', { usuario: blanco, body: { eventoId: standup.id, puntuacion: 3, detalle: 'x' } });
    assert.deepEqual([res.status, res.body.error], [409, 'Solo podés reseñar eventos a los que asististe']);
  });

  it('el organizador recibe la notificación de la reseña', async () => {
    const res = await pedir('GET', `/usuarios/${dilollo.id}/notificaciones`, { usuario: dilollo });
    assert.ok(res.body.resultados.some((n) => n.tipo === 'RESENIA' && n.puntuacion === 4 && !n.leida));
  });
});

describe('flujo de cuenta: registrarse, editar el perfil y volver a entrar', () => {
  let cuenta;

  it('se registra y entra con esa cuenta', async () => {
    const res = await pedir('POST', '/usuarios', { body: { nombre: 'Camila', apellido: 'Ríos', email: 'Camila@Gmail.com', contrasenia: 'camila1234' } });
    assert.equal(res.status, 201);
    cuenta = res.body;
    assert.equal(res.headers.get('location'), `/usuarios/${cuenta.id}`);
    assert.equal(cuenta.email, 'camila@gmail.com');
    assert.equal('contraseniaHash' in cuenta, false);
    const sesion = await pedir('POST', '/sesiones', { body: { email: 'camila@gmail.com', contrasenia: 'camila1234' } });
    assert.equal(sesion.body.id, cuenta.id);
  });

  it('no se puede registrar dos veces el mismo email', async () => {
    const res = await pedir('POST', '/usuarios', { body: { nombre: 'C', apellido: 'R', email: 'camila@gmail.com', contrasenia: 'camila1234' } });
    assert.equal(res.status, 409);
  });

  it('cambia la contraseña con la actual, y la vieja deja de andar', async () => {
    const yo = { id: cuenta.id };
    assert.equal((await pedir('PATCH', `/usuarios/${cuenta.id}`, { usuario: yo, body: { contraseniaActual: 'mal', contraseniaNueva: 'nueva12345' } })).status, 401);
    const res = await pedir('PATCH', `/usuarios/${cuenta.id}`, { usuario: yo, body: { apellido: 'Paz', contraseniaActual: 'camila1234', contraseniaNueva: 'nueva12345' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.apellido, 'Paz');
    assert.equal((await pedir('POST', '/sesiones', { body: { email: 'camila@gmail.com', contrasenia: 'camila1234' } })).status, 401);
    assert.equal((await pedir('POST', '/sesiones', { body: { email: 'camila@gmail.com', contrasenia: 'nueva12345' } })).status, 200);
  });

  it('nadie más edita el perfil', async () => {
    assert.equal((await pedir('PATCH', `/usuarios/${cuenta.id}`, { usuario: tomas, body: { nombre: 'X' } })).status, 403);
  });
});

describe('favoritos y notificaciones', () => {
  it('marca y desmarca un favorito sin duplicar', async () => {
    const ruta = `/usuarios/${blanco.id}/favoritos`;
    assert.equal((await pedir('PUT', `${ruta}/${rock.id}`, { usuario: blanco })).status, 204);
    assert.equal((await pedir('PUT', `${ruta}/${rock.id}`, { usuario: blanco })).status, 204);
    assert.deepEqual((await pedir('GET', ruta, { usuario: blanco })).body.map((e) => e.id), [rock.id]);
    assert.equal((await pedir('DELETE', `${ruta}/${rock.id}`, { usuario: blanco })).status, 204);
    assert.deepEqual((await pedir('GET', ruta, { usuario: blanco })).body, []);
    assert.equal((await pedir('PUT', `${ruta}/999`, { usuario: blanco })).status, 404);
    assert.equal((await pedir('GET', `/usuarios/${paredes.id}/favoritos`, { usuario: blanco })).status, 403);
  });

  it('abre una notificación y después marca todas como leídas', async () => {
    const ruta = `/usuarios/${tomas.id}/notificaciones`;
    const inicial = await pedir('GET', ruta, { usuario: tomas });
    assert.ok(inicial.body.noLeidas > 1);
    const primera = inicial.body.resultados.find((n) => !n.leida);
    assert.equal((await pedir('PUT', `${ruta}/${primera.id}/lectura`, { usuario: tomas })).status, 204);
    assert.equal((await pedir('GET', ruta, { usuario: tomas })).body.noLeidas, inicial.body.noLeidas - 1);
    assert.equal((await pedir('PUT', `${ruta}/no-existe/lectura`, { usuario: tomas })).status, 404);
    assert.equal((await pedir('PUT', `${ruta}/lectura`, { usuario: tomas })).status, 204);
    assert.equal((await pedir('GET', ruta, { usuario: tomas })).body.noLeidas, 0);
    assert.equal((await pedir('GET', ruta, { usuario: blanco })).status, 403);
  });
});

describe('errores comunes de la API', () => {
  it('401 sin usuario activo, 404 en lo que no existe y 405 con Allow', async () => {
    assert.deepEqual((await pedir('GET', '/compras')).body, { error: 'Falta indicar el usuario activo' });
    assert.equal((await pedir('GET', '/compras', { usuario: { id: 999 } })).status, 401);
    assert.equal((await pedir('GET', '/eventos/999')).status, 404);
    assert.equal((await pedir('GET', '/compras/999', { usuario: paredes })).status, 404);
    assert.equal((await pedir('GET', '/usuarios/999/eventos')).status, 404);
    assert.equal((await pedir('GET', '/no-existe')).status, 404);
    const metodo = await pedir('DELETE', '/eventos');
    assert.equal(metodo.status, 405);
    assert.equal(metodo.headers.get('allow'), 'GET, POST');
  });

  it('400 con un JSON inválido o un parámetro mal formado', async () => {
    const res = await fetch(`${base}/sesiones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{malo' });
    assert.equal(res.status, 400);
    assert.equal((await pedir('GET', '/eventos?orden=cualquiera')).status, 400);
    assert.equal((await pedir('GET', '/eventos/abc')).status, 400);
  });
});
