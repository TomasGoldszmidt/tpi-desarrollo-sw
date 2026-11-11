import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Pie de un listado que carga de a páginas (ver usePaginado): spinner mientras llega
// la página siguiente, el error con Reintentar si falló, y al final cuántos hay en total.
// Con una sola página no muestra nada. cargando y fin son los textos de cada listado
// ("Cargando más eventos…", "Ya viste los 18 eventos").
export function PieLista({ cargandoMas, errorMas, hayMas, varias, onReintentar, cargando, fin }) {
  if (cargandoMas) {
    return (
      <View style={styles.pie}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.texto}>{cargando}</Text>
      </View>
    );
  }
  if (errorMas) {
    return (
      <View style={[styles.pie, styles.error]}>
        <Text style={[styles.texto, styles.centrado]}>{errorMas}</Text>
        <Pressable style={styles.boton} onPress={onReintentar}>
          <Text style={styles.botonTexto}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
  if (!hayMas && varias) {
    return (
      <View style={styles.pie}>
        <Text style={styles.texto}>{fin}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  error: {
    flexDirection: 'column',
  },
  texto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  centrado: {
    textAlign: 'center',
  },
  boton: {
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
