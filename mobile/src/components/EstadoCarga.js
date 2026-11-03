import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Dentro de una pantalla ya abierta: un spinner con un mensaje mientras carga
// (ej: "Buscando eventos…"), o el error con el botón para reintentar.
export function EstadoCarga({ loading, error, onRetry, mensaje }) {
  if (loading) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator size="large" color={colors.primary} />
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.error}>{error}</Text>
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
  mensaje: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.body,
    fontWeight: 'bold',
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
