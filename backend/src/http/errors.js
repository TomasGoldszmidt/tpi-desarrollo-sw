// Errores con su status HTTP. Los lanzan los controladores, los services, el dominio y los middlewares;
// el errorHandler los convierte en la respuesta { error: mensaje }.
export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

// Dato faltante o inválido.
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

// Falta el usuario activo o no existe.
export class UnauthorizedError extends AppError {
  constructor(message = 'Falta indicar el usuario activo') {
    super(message, 401);
  }
}

// El usuario no tiene permiso sobre ese recurso.
export class ForbiddenError extends AppError {
  constructor(message = 'No tenés permiso para hacer esto') {
    super(message, 403);
  }
}

// No existe el recurso.
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

// Se viola una regla de negocio (sin cupo, transición de estado inválida, etc.).
export class BusinessRuleError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

// La URL existe pero no acepta ese método. El errorHandler agrega el header Allow.
export class MethodNotAllowedError extends AppError {
  constructor(method, permitidos) {
    super(`La ruta no acepta ${method}; acepta ${permitidos.join(', ')}`, 405);
    this.permitidos = permitidos;
  }
}
