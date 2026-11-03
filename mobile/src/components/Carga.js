import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Logo, Marca } from './Logo.js';
import { colors, fontSize, spacing } from '../theme.js';

// Pantalla completa con el logo, para cuando una pantalla se abre y todavía no tiene
// nada para mostrar (ej: "Cargando el evento…").
export function PantallaCarga({ mensaje }) {
  return (
    <View style={styles.pantalla}>
      <Logo size="large" />
      <View style={styles.marca}>
        <Marca fontSize={28} />
      </View>
      <ActivityIndicator size="large" color={colors.primary} />
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </View>
  );
}

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
  pantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  marca: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
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
