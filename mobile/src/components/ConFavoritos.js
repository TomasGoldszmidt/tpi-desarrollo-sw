import { useUsuario } from '../context/UsuarioContext.js';
import { FavoritosProvider } from '../context/FavoritosContext.js';
import { NotificacionesProvider } from '../context/NotificacionesContext.js';

// Los favoritos y las notificaciones dependen del usuario: con key, al cambiar de sesión
// arrancan de cero.
export function ConFavoritos({ children }) {
  const { usuario } = useUsuario();
  const key = usuario?.id ?? 'sin-sesion';
  return (
    <FavoritosProvider key={`favoritos-${key}`}>
      <NotificacionesProvider key={`notificaciones-${key}`}>{children}</NotificacionesProvider>
    </FavoritosProvider>
  );
}
