import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Cubre la pantalla mientras se confirma una acción (comprar, pagar, cancelar): deja
// adivinar lo de abajo pero no se puede tocar nada hasta que responde el servidor.
export function CargaEncima({ mensaje }) {
  return (
    <View style={styles.encima} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mensaje: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.md,
  },
  encima: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});
