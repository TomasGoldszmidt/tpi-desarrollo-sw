import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as usuarioRepository from '../src/persistence/repositories/usuarioRepository.js';
import { desmarcarFavorito, listarFavoritos, marcarFavorito } from '../src/domain/favorito.js';
import { ForbiddenError, NotFoundError } from '../src/http/errors.js';

const seed = loadSeed();
const { sofia, juan } = seed.usuarios;
const { partido, festival, acustico, rock } = seed.eventos;

describe('favoritos', () => {
  it('Sofía arranca con tres, por fecha y con el ya realizado incluido', () => {
    const favoritos = listarFavoritos(sofia, sofia.id);
    assert.deepEqual(favoritos.map((e) => e.id), [acustico.id, partido.id, festival.id]);
    // Misma forma que el catálogo: lo que necesita la tarjeta.
    assert.deepEqual(Object.keys(favoritos[0]).sort(), ['categoria', 'fecha', 'id', 'imagen', 'lugar', 'nombre', 'organizador', 'precioDesde']);
  });

  it('Juan arranca sin favoritos', () => {
    assert.deepEqual(listarFavoritos(juan, juan.id), []);
  });

  it('marcar dos veces no duplica y desmarcar dos veces no falla', () => {
    marcarFavorito(juan, juan.id, rock.id);
    marcarFavorito(juan, juan.id, rock.id);
    assert.deepEqual(usuarioRepository.findById(juan.id).favoritos, [rock.id]);
    desmarcarFavorito(juan, juan.id, rock.id);
    desmarcarFavorito(juan, juan.id, rock.id);
    assert.deepEqual(usuarioRepository.findById(juan.id).favoritos, []);
  });

  it('no se puede marcar un evento que no existe', () => {
    assert.throws(() => marcarFavorito(juan, juan.id, 999), NotFoundError);
  });

  it('solo el propio usuario ve y cambia sus favoritos', () => {
    assert.throws(() => listarFavoritos(juan, sofia.id), ForbiddenError);
    assert.throws(() => marcarFavorito(juan, sofia.id, rock.id), ForbiddenError);
    assert.throws(() => desmarcarFavorito(juan, sofia.id, festival.id), ForbiddenError);
  });
});
