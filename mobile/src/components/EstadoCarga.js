import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Lo que muestra una pantalla mientras carga o si falló el pedido, con el botón para reintentar.
// detalle es un texto opcional debajo del error (ej: la URL del backend).
export function EstadoCarga({ loading, error, detalle, onRetry }) {
  if (loading) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.error}>{error}</Text>
      {detalle ? <Text style={styles.detalle}>{detalle}</Text> : null}
      <Pressable style={styles.boton} onPress={onRetry}>
        <Text style={styles.botonTexto}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.body,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detalle: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    textAlign: 'center',
  },
  boton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  botonTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
  },
});
