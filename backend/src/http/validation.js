import { ValidationError } from './errors.js';

// Validan la forma de un dato de entrada y devuelven el valor ya convertido.
// Si no cumple, lanzan ValidationError con un mensaje para mostrar en la app.
// Las reglas de negocio (cupo, estados) no van acá: van en el dominio.

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

// Ids de path, query o body. Acepta "3" o 3.
export function requireId(value, field = 'id') {
  const id = Number(value);
  if (isMissing(value) || !Number.isInteger(id) || id < 1) {
    throw new ValidationError(`El campo ${field} tiene que ser un id válido`);
  }
  return id;
}

export function requireInteger(value, field, { min, max } = {}) {
  if (isMissing(value)) throw new ValidationError(`Falta el campo ${field}`);
  const number = Number(value);
  if (!Number.isInteger(number)) throw new ValidationError(`El campo ${field} tiene que ser un número entero`);
  checkRange(number, field, { min, max });
  return number;
}

export function requireNumber(value, field, { min, max } = {}) {
  if (isMissing(value)) throw new ValidationError(`Falta el campo ${field}`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new ValidationError(`El campo ${field} tiene que ser un número`);
  checkRange(number, field, { min, max });
  return number;
}

function checkRange(number, field, { min, max }) {
  if (min !== undefined && number < min) throw new ValidationError(`El campo ${field} tiene que ser como mínimo ${min}`);
  if (max !== undefined && number > max) throw new ValidationError(`El campo ${field} tiene que ser como máximo ${max}`);
}

// Devuelve el texto sin espacios en los extremos; no acepta texto vacío.
export function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`Falta el campo ${field}`);
  }
  return value.trim();
}

export function requireDate(value, field) {
  if (isMissing(value)) throw new ValidationError(`Falta el campo ${field}`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError(`El campo ${field} tiene que ser una fecha válida`);
  return date;
}

export function requireArray(value, field, { minLength = 0 } = {}) {
  if (!Array.isArray(value)) throw new ValidationError(`El campo ${field} tiene que ser una lista`);
  if (value.length < minLength) throw new ValidationError(`El campo ${field} tiene que tener al menos ${minLength} elemento(s)`);
  return value;
}
