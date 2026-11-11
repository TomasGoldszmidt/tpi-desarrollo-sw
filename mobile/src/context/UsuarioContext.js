import { createContext, useContext, useState } from 'react';
import { setUsuarioActivoId } from '../api/client.js';

const UsuarioContext = createContext(null);

// Guarda la cuenta del usuario que inició sesión (con su email). Su id viaja en el
// header X-User-Id. La sesión no se recuerda al cerrar la app.
export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  function guardar(cuenta) {
    setUsuarioActivoId(cuenta?.id ?? null);
    setUsuario(cuenta);
  }

  const valor = {
    usuario,
    // Al iniciar sesión o crear la cuenta.
    iniciarSesion: guardar,
    // Al editar el perfil, para que el chip y los datos queden al día.
    actualizarCuenta: guardar,
    cerrarSesion: () => guardar(null),
  };

  return <UsuarioContext.Provider value={valor}>{children}</UsuarioContext.Provider>;
}

export function useUsuario() {
  return useContext(UsuarioContext);
}
