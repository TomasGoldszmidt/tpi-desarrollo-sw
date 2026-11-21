// Validaciones de los formularios de cuenta (inicio de sesión, registro y perfil).

export const emailValido = (texto) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto.trim());
export const MIN_CONTRASENIA = 8;
