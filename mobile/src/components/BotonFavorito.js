import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFavoritos } from '../context/FavoritosContext.js';
import { colors, TOQUE_MINIMO } from '../theme.js';

const ROSA = '#D4537E';

// Corazón para marcar o quitar un evento de favoritos. Vacío si no es favorito, lleno si lo es,
// y un spinner chico mientras se guarda. Dentro de una tarjeta, tocarlo no abre el evento.
// Siempre mide 44 de lado para tocarlo cómodo.
export function BotonFavorito({ eventoId, size = 22, color = colors.textMuted }) {
  const { esFavorito, estaGuardando, alternar } = useFavoritos();
  const favorito = esFavorito(eventoId);

  return (
    <Pressable
      style={styles.boton}
      onPress={() => alternar(eventoId)}
      accessibilityRole="button"
      accessibilityState={{ selected: favorito }}
      accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
    >
      {estaGuardando(eventoId) ? (
        <ActivityIndicator size="small" color={ROSA} />
      ) : (
        <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={size} color={favorito ? ROSA : color} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
