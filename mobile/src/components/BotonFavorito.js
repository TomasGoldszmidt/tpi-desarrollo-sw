import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFavoritos } from '../context/FavoritosContext.js';
import { colors } from '../theme.js';

const ROSA = '#D4537E';

// Corazón para marcar o quitar un evento de favoritos. Vacío si no es favorito, lleno si lo es,
// y un spinner chico mientras se guarda. Dentro de una tarjeta, tocarlo no abre el evento.
export function BotonFavorito({ eventoId, size = 22 }) {
  const { esFavorito, estaGuardando, alternar } = useFavoritos();
  const favorito = esFavorito(eventoId);

  return (
    <Pressable
      style={[styles.boton, { width: size + 8, height: size + 8 }]}
      onPress={() => alternar(eventoId)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      {estaGuardando(eventoId) ? (
        <ActivityIndicator size="small" color={ROSA} />
      ) : (
        <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={size} color={favorito ? ROSA : colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
