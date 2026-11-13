import { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { getFavoritos, marcarFavorito, quitarFavorito } from '../api/favoritos.js';
import { useUsuario } from './UsuarioContext.js';
import { useAvisos } from './AvisosContext.js';

const FavoritosContext = createContext(null);

// Ids de los eventos favoritos del usuario que inició sesión, compartidos por el
// catálogo, el detalle del evento y la pestaña Favoritos. Arrancan con los de la
// cuenta (el inicio de sesión los trae) y, después de cada cambio, se vuelven a
// pedir al backend. Se monta con key = id del usuario: al cambiar de sesión arranca de cero.
// Al quitar uno aparece el aviso "Lo quitaste de favoritos · Deshacer".
export function FavoritosProvider({ children }) {
  const { usuario } = useUsuario();
  const avisos = useAvisos();
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

  // Marca o quita según `marcar` y vuelve a pedir los favoritos.
  async function guardar(eventoId, marcar) {
    cambiarGuardando(eventoId, true);
    try {
      if (marcar) await marcarFavorito(usuario.id, eventoId);
      else await quitarFavorito(usuario.id, eventoId);
      const favoritos = await getFavoritos(usuario.id);
      setIds(new Set(favoritos.map((evento) => evento.id)));
      return true;
    } catch (e) {
      Alert.alert('No pudimos guardar el favorito', e.message);
      return false;
    } finally {
      cambiarGuardando(eventoId, false);
    }
  }

  async function alternar(eventoId) {
    if (!usuario || guardando.has(eventoId)) return;
    const quitar = ids.has(eventoId);
    const ok = await guardar(eventoId, !quitar);
    if (ok && quitar) {
      avisos.mostrar('Lo quitaste de favoritos.', { titulo: 'Deshacer', onPress: () => guardar(eventoId, true) });
    } else if (ok) {
      avisos.mostrar('Lo guardaste en Favoritos.');
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
