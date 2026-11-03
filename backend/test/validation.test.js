import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireDate, requireId, requireInteger, requireNumber, requireUrl } from '../src/http/validation.js';
import { ValidationError } from '../src/http/errors.js';

const invalido = (fn) => assert.throws(fn, ValidationError);

describe('validaciones de entrada', () => {
  it('los números aceptan number o texto numérico, nada más', () => {
    assert.equal(requireId('3'), 3);
    assert.equal(requireId(3), 3);
    assert.equal(requireInteger(' 2 ', 'cantidad'), 2);
    assert.equal(requireNumber('4.5', 'precio'), 4.5);
    for (const valor of [true, false, [2], {}, '2a', 1.5, 0, -1]) invalido(() => requireId(valor));
    for (const valor of [true, [2], { n: 2 }, '2a']) invalido(() => requireInteger(valor, 'cantidad'));
    for (const valor of [true, [4.5], 'cuatro']) invalido(() => requireNumber(valor, 'precio'));
  });

  it('las fechas tienen que venir como texto ISO', () => {
    assert.deepEqual(requireDate('2027-03-15T19:00:00.000Z', 'fecha'), new Date('2027-03-15T19:00:00.000Z'));
    for (const valor of [12345, true, 'mañana', ['2027-03-15']]) invalido(() => requireDate(valor, 'fecha'));
  });

  it('las URLs tienen que ser http o https', () => {
    assert.equal(requireUrl(' https://picsum.photos/800/400 ', 'multimedia[0]'), 'https://picsum.photos/800/400');
    assert.equal(requireUrl('http://localhost/a.png', 'multimedia[0]'), 'http://localhost/a.png');
    for (const valor of ['hola', 'ftp://x.com/a.png', 'javascript:alert(1)', 3]) invalido(() => requireUrl(valor, 'multimedia[0]'));
  });
});
