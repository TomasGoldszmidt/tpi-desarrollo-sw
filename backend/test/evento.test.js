import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as compraRepository from '../src/persistence/repositories/compraRepository.js';
import * as eventoRepository from '../src/persistence/repositories/eventoRepository.js';
import {
  tuPrecioEstaEntre, nuevoEvento, detalleEvento, buscarEventos, precioDesde, eventosOrganizados, verificarOrganizador,
  filtroOrganizador, cantidadesOrganizador,
} from '../src/domain/evento.js';
import { puntajeDe } from '../src/domain/resenia.js';
import * as eventoService from '../src/services/eventoService.js';
import { puntajesDeOrganizadores } from '../src/services/reseniaService.js';
import { BusinessRuleError, ForbiddenError } from '../src/http/errors.js';

// Se usa el seed real: los casos borde (Backstage agotado, eventos pasados) ya están ahí.
const seed = loadSeed();

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

  it('el dominio arma el evento con el usuario activo como organizador, sin guardarlo', () => {
    const evento = nuevoEvento(datos(), dilollo, ahora);
    assert.equal(evento.organizadorId, dilollo.id);
    assert.equal(evento.id, undefined);
  });

  it('el service lo guarda y devuelve el detalle', () => {
    const detalle = eventoService.crearEvento(datos(), dilollo, ahora);
    assert.equal(detalle.organizador.id, dilollo.id);
    assert.equal(detalle.categoria.id, seed.categorias.conferencias.id);
    assert.equal(eventoRepository.findById(detalle.id).nombre, 'Charla de prueba');
    assert.equal(eventoRepository.findById(detalle.id).organizadorId, dilollo.id);
    assert.deepEqual(detalle.tiposEntrada.map((t) => [t.id, t.disponibles]), [[1, 50]]);
  });

  it('rechaza una categoría inexistente', () => {
    assert.throws(() => eventoService.crearEvento(datos({ categoriaId: 99 }), dilollo, ahora),
      (err) => err.status === 400 && err.message === 'No existe la categoría 99');
  });

  it('rechaza una fecha que no es futura', () => {
    assert.throws(() => nuevoEvento(datos({ fecha: ahora }), dilollo, ahora),
      (err) => err instanceof BusinessRuleError && err.message === 'La fecha del evento tiene que ser futura');
  });

  it('rechaza tipos de entrada con el nombre repetido, sin importar mayúsculas', () => {
    const tiposEntrada = [
      { nombre: 'Platea', descripcion: 'a', precio: 10, cupo: 1 },
      { nombre: 'platea ', descripcion: 'b', precio: 20, cupo: 1 },
    ];
    assert.throws(() => nuevoEvento(datos({ tiposEntrada }), dilollo, ahora),
      (err) => err instanceof BusinessRuleError && err.message === 'Hay tipos de entrada con el nombre repetido');
  });
});

describe('detalle de evento', () => {
  it('reemplaza los ids por resúmenes y calcula las disponibles por tipo', () => {
    const { festival } = seed.eventos;
    const { tomas } = seed.usuarios;
    const detalle = detalleEvento(
      festival, compraRepository.findByEvento(festival.id), seed.categorias.festivales, tomas,
      puntajeDe(tomas, puntajesDeOrganizadores()),
    );
    assert.equal(detalle.categoriaId, undefined);
    assert.equal(detalle.organizadorId, undefined);
    assert.deepEqual(detalle.categoria, { id: seed.categorias.festivales.id, nombre: 'Festivales' });
    assert.deepEqual(detalle.organizador, { id: tomas.id, nombre: 'Tomas', apellido: 'Goldszmidt', puntaje: 4.5, cantidadResenias: 14 });
    assert.deepEqual(detalle.tiposEntrada.map((t) => [t.nombre, t.disponibles]), [['General', 1000], ['VIP', 100], ['Backstage', 0]]);
  });

  it('el service da el mismo detalle por id', () => {
    const { festival } = seed.eventos;
    assert.deepEqual(eventoService.verEvento(festival.id).tiposEntrada.map((t) => t.disponibles), [1000, 100, 0]);
    assert.throws(() => eventoService.verEvento(9999), (err) => err.status === 404 && err.message === 'No existe el evento 9999');
  });
});

describe('búsqueda de eventos', () => {
  const { rock, obra, festival, partido, acustico, standup } = seed.eventos;
  // Otros tests crean eventos; se compara solo contra los del seed.
  const delSeed = new Set(Object.values(seed.eventos).map((e) => e.id));
  const ids = (resultado) => resultado.map((e) => e.id).filter((id) => delSeed.has(id));
  const delSeedEnMemoria = () => eventoRepository.findAll().filter((e) => delSeed.has(e.id));
  const buscar = (filtros = {}) => buscarEventos(delSeedEnMemoria(), filtros, eventoService.contextoResumenes());
  const catalogo = (filtros = {}) => eventoService.buscarEnCatalogo(filtros, { pagina: 1, limite: 50 }).resultados;

  it('por defecto ordena por fecha y oculta los eventos pasados', () => {
    const resultado = ids(buscar());
    assert.deepEqual(resultado, [obra.id, partido.id, rock.id, festival.id]);
    assert.equal(resultado.includes(acustico.id) || resultado.includes(standup.id), false);
    assert.deepEqual(ids(catalogo()), resultado);
  });

  it('ordena por precio desde la entrada más barata', () => {
    assert.equal(precioDesde(festival), 90000);
    assert.deepEqual(ids(buscar({ orden: 'precio' })), [partido.id, obra.id, rock.id, festival.id]);
  });

  it('ordena por puntaje con los organizadores sin reseñas al final', () => {
    assert.deepEqual(ids(buscar({ orden: 'puntaje' })), [obra.id, rock.id, festival.id, partido.id]);
  });

  it('filtra por rango de precio en el dominio', () => {
    assert.deepEqual(ids(buscar({ precioMin: 100000 })), [festival.id]);
  });

  it('el catálogo filtra por texto sin tildes y por categoría', () => {
    assert.deepEqual(ids(catalogo({ texto: 'musica' })), [festival.id]);
    assert.deepEqual(ids(catalogo({ categoriaId: seed.categorias.musica.id })), [rock.id]);
    assert.deepEqual(ids(catalogo({ precioMin: 100000 })), [festival.id]);
    assert.deepEqual(catalogo({ categoriaId: 99 }), []);
  });

  it('cada resultado es un resumen con imagen, precio y puntaje', () => {
    const [primero] = catalogo({ texto: 'Bernarda' });
    assert.deepEqual(primero.organizador, { id: seed.usuarios.tomas.id, nombre: 'Tomas', apellido: 'Goldszmidt', puntaje: 4.5, cantidadResenias: 14 });
    assert.equal(primero.precioDesde, 20000);
    assert.equal(primero.imagen, 'https://picsum.photos/seed/bernarda/800/400');
    assert.equal(primero.tiposEntrada, undefined);
  });
});

describe('ventas del organizador', () => {
  const { tomas, dilollo } = seed.usuarios;
  const { rock, obra, festival, acustico } = seed.eventos;
  const delSeed = new Set(Object.values(seed.eventos).map((e) => e.id));
  const organizados = () => eventosOrganizados(eventoRepository.findByOrganizador(tomas.id), eventoService.contextoResumenes());

  it('eventosOrganizados trae solo los suyos: primero los próximos y después los realizados', () => {
    const lista = organizados();
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
    const lista = organizados().map((e) => ({ ...e, conMensajesNoLeidos: e.id === rock.id ? 1 : 0 }));
    assert.deepEqual(lista.filter((e) => filtroOrganizador(e, 'conMensajesNuevos')).map((e) => e.id), [rock.id]);
    assert.ok(lista.filter((e) => filtroOrganizador(e, 'realizados')).some((e) => e.id === acustico.id));
    assert.ok(!lista.filter((e) => filtroOrganizador(e, 'proximos')).some((e) => e.id === acustico.id));
    assert.equal(lista.filter((e) => filtroOrganizador(e, undefined)).length, lista.length);
    const cantidades = cantidadesOrganizador(lista);
    assert.equal(cantidades.todos, lista.length);
    assert.equal(cantidades.proximos + cantidades.realizados, cantidades.todos);
    assert.equal(cantidades.conMensajesNuevos, 1);
  });

  it('eventosDe pagina los del organizador, con el filtro y las cantidades de los chips', () => {
    const pagina = { pagina: 1, limite: 50 };
    const todos = eventoService.eventosDe(tomas.id, undefined, pagina);
    assert.deepEqual(todos.resultados.map((e) => e.id).filter((id) => delSeed.has(id)), [obra.id, rock.id, festival.id, acustico.id]);
    assert.equal(todos.resultados.every((e) => typeof e.conMensajesNoLeidos === 'number'), true);
    assert.equal(todos.cantidades.todos, todos.resultados.length);
    const realizados = eventoService.eventosDe(tomas.id, 'realizados', pagina);
    assert.equal(realizados.resultados.length, todos.cantidades.realizados);
    assert.ok(realizados.resultados.some((e) => e.id === acustico.id));
    assert.throws(() => eventoService.eventosDe(9999, undefined, pagina), (err) => err.status === 404);
  });

  it('solo el organizador ve las ventas de su evento', () => {
    assert.doesNotThrow(() => verificarOrganizador(rock, tomas));
    assert.throws(() => verificarOrganizador(rock, dilollo),
      (err) => err instanceof ForbiddenError && err.message === 'Solo el organizador puede ver las ventas de este evento');
  });
});
