import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSeed } from '../src/persistence/seed.js';
import * as usuarioRepository from '../src/persistence/repositories/usuarioRepository.js';
import { desmarcarFavorito, listarFavoritos, marcarFavorito } from '../src/domain/favorito.js';
import { ForbiddenError, NotFoundError } from '../src/http/errors.js';

const seed = loadSeed();
const { paredes, blanco } = seed.usuarios;
const { partido, festival, acustico, rock } = seed.eventos;

describe('favoritos', () => {
  it('Paredes arranca con tres, por fecha y con el ya realizado incluido', () => {
    const favoritos = listarFavoritos(paredes, paredes.id);
    assert.deepEqual(favoritos.map((e) => e.id), [acustico.id, partido.id, festival.id]);
    // Misma forma que el catálogo: lo que necesita la tarjeta.
    assert.deepEqual(Object.keys(favoritos[0]).sort(), ['categoria', 'fecha', 'id', 'imagen', 'lugar', 'nombre', 'organizador', 'precioDesde']);
  });

  it('Blanco arranca sin favoritos', () => {
    assert.deepEqual(listarFavoritos(blanco, blanco.id), []);
  });

  it('marcar dos veces no duplica y desmarcar dos veces no falla', () => {
    marcarFavorito(blanco, blanco.id, rock.id);
    marcarFavorito(blanco, blanco.id, rock.id);
    assert.deepEqual(usuarioRepository.findById(blanco.id).favoritos, [rock.id]);
    desmarcarFavorito(blanco, blanco.id, rock.id);
    desmarcarFavorito(blanco, blanco.id, rock.id);
    assert.deepEqual(usuarioRepository.findById(blanco.id).favoritos, []);
  });

  it('no se puede marcar un evento que no existe', () => {
    assert.throws(() => marcarFavorito(blanco, blanco.id, 999), NotFoundError);
  });

  it('solo el propio usuario ve y cambia sus favoritos', () => {
    assert.throws(() => listarFavoritos(blanco, paredes.id), ForbiddenError);
    assert.throws(() => marcarFavorito(blanco, paredes.id, rock.id), ForbiddenError);
    assert.throws(() => desmarcarFavorito(blanco, paredes.id, festival.id), ForbiddenError);
  });
});
