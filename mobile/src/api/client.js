import { API_URL } from '../config.js';

// Lo fija UsuarioContext al elegir usuario; viaja en el header X-User-Id.
let usuarioActivoId = null;

export function setUsuarioActivoId(id) {
  usuarioActivoId = id;
}

// Hace el pedido al backend y devuelve el JSON de la respuesta.
// Si falla, lanza un Error con el mensaje que manda el backend ({ "error": "..." }),
// que ya viene en español y se puede mostrar tal cual.
export async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (usuarioActivoId !== null) {
    headers['X-User-Id'] = String(usuarioActivoId);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el backend');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `Error ${response.status} del backend`);
  }
  return data;
}
