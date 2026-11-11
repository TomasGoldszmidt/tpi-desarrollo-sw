import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { getFavoritos, marcarFavorito, quitarFavorito } from '../api/favoritos.js';
import { useUsuario } from './UsuarioContext.js';

const FavoritosContext = createContext(null);

// Ids de los eventos favoritos del usuario que inició sesión, compartidos por el
// catálogo, el detalle del evento y la pestaña Favoritos. Arrancan con los de la
// cuenta (el inicio de sesión los trae) y, después de cada cambio, se vuelven a
// pedir al backend. Se monta con key = id del usuario: al cambiar de sesión arranca de cero.
export function FavoritosProvider({ children }) {
  const { usuario } = useUsuario();
  const [ids, setIds] = useState(() => new Set(usuario?.favoritos ?? []));
  // Los eventos cuyo corazón se está guardando (muestran un spinner).
  const [guardando, setGuardando] = useState(() => new Set());

  function cambiarGuardando(eventoId, activo) {
    setGuardando((anteriores) => {
      const nuevos = new Set(anteriores);
      if (activo) nuevos.add(eventoId);
      else nuevos.delete(eventoId);
      return nuevos;
    });
  }

  async function alternar(eventoId) {
    if (!usuario || guardando.has(eventoId)) return;
    cambiarGuardando(eventoId, true);
    try {
      if (ids.has(eventoId)) await quitarFavorito(usuario.id, eventoId);
      else await marcarFavorito(usuario.id, eventoId);
      const favoritos = await getFavoritos(usuario.id);
      setIds(new Set(favoritos.map((evento) => evento.id)));
    } catch (e) {
      Alert.alert('No pudimos guardar el favorito', e.message);
    } finally {
      cambiarGuardando(eventoId, false);
    }
  }

  const valor = {
    esFavorito: (eventoId) => ids.has(eventoId),
    estaGuardando: (eventoId) => guardando.has(eventoId),
    alternar,
  };

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  return useContext(FavoritosContext);
}
