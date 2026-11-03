import { createContext, useContext, useState } from 'react';
import { setUsuarioActivoId } from '../api/client.js';

const UsuarioContext = createContext(null);

// Guarda el usuario activo. No hay login: se elige de la lista de GET /usuarios
// y no se recuerda al cerrar la app.
export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  function elegirUsuario(nuevoUsuario) {
    setUsuarioActivoId(nuevoUsuario?.id ?? null);
    setUsuario(nuevoUsuario);
  }

  return (
    <UsuarioContext.Provider value={{ usuario, elegirUsuario }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  return useContext(UsuarioContext);
}
