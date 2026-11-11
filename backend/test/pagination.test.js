import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITE_MAXIMO, LIMITE_POR_DEFECTO, paginar, parsePagina } from '../src/http/pagination.js';
import { ValidationError } from '../src/http/errors.js';

const invalido = (query) => assert.throws(() => parsePagina(query), ValidationError);
const numeros = (n) => Array.from({ length: n }, (_, i) => i + 1);

describe('paginación', () => {
  it('sin parámetros (o vacíos) es la primera página con el límite por defecto', () => {
    assert.deepEqual(parsePagina({}), { pagina: 1, limite: LIMITE_POR_DEFECTO });
    assert.deepEqual(parsePagina({ pagina: '', limite: '' }), { pagina: 1, limite: LIMITE_POR_DEFECTO });
    assert.deepEqual(parsePagina({ pagina: '3', limite: '5' }), { pagina: 3, limite: 5 });
    assert.deepEqual(parsePagina({ limite: String(LIMITE_MAXIMO) }), { pagina: 1, limite: LIMITE_MAXIMO });
  });

  it('rechaza páginas y límites inválidos o repetidos', () => {
    for (const pagina of ['0', '-1', 'abc', '1.5']) invalido({ pagina });
    for (const limite of ['0', String(LIMITE_MAXIMO + 1), 'diez']) invalido({ limite });
    invalido({ pagina: ['1', '2'] });
    invalido({ limite: ['5', '10'] });
  });

  it('corta la lista y avisa si hay más', () => {
    assert.deepEqual(paginar(numeros(12), { pagina: 1, limite: 5 }), {
      resultados: [1, 2, 3, 4, 5], pagina: 1, limite: 5, total: 12, hayMas: true,
    });
    const ultima = paginar(numeros(12), { pagina: 3, limite: 5 });
    assert.deepEqual(ultima.resultados, [11, 12]);
    assert.equal(ultima.hayMas, false);
    // Justo al límite: no hay más.
    assert.equal(paginar(numeros(10), { pagina: 2, limite: 5 }).hayMas, false);
  });

  it('una página después de la última viene vacía, y suma los campos extra', () => {
    const pasada = paginar(numeros(3), { pagina: 4, limite: 5 }, { noLeidas: 2 });
    assert.deepEqual(pasada, { resultados: [], pagina: 4, limite: 5, total: 3, hayMas: false, noLeidas: 2 });
  });
});
