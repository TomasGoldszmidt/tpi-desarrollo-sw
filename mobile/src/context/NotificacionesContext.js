import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getNotificaciones } from '../api/notificaciones.js';
import { useUsuario } from './UsuarioContext.js';

// Cada cuánto se vuelve a preguntar si hay notificaciones nuevas. El backend no tiene
// tiempo real: igual que el chat, la app pregunta cada tanto.
const INTERVALO_MS = 30000;

const NotificacionesContext = createContext(null);

// Cantidad de notificaciones nuevas del usuario que inició sesión, para el número de la
// campana. Se pide al iniciar sesión, cada 30 segundos y cuando una pantalla lo pide
// (al volver a una pestaña o después de marcarlas como leídas).
// Se monta con key = id del usuario: al cambiar de sesión arranca de cero.
export function NotificacionesProvider({ children }) {
  const { usuario } = useUsuario();
  const [noLeidas, setNoLeidas] = useState(0);
  const usuarioId = usuario?.id ?? null;

  // Si falla (sin conexión) se deja el número que había: no es para mostrar un error.
  const actualizar = useCallback(() => {
    if (usuarioId === null) return;
    getNotificaciones(usuarioId).then(
      (lista) => setNoLeidas(lista.filter((notificacion) => !notificacion.leida).length),
      () => {},
    );
  }, [usuarioId]);

  useEffect(() => {
    actualizar();
    const intervalo = setInterval(actualizar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [actualizar]);

  return (
    <NotificacionesContext.Provider value={{ noLeidas, actualizar }}>{children}</NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  return useContext(NotificacionesContext);
}
