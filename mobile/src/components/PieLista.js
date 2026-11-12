import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Pie de un listado que carga de a páginas (ver usePaginado): spinner mientras llega
// la página siguiente, el error con Reintentar si falló, y al final cuántos hay en total.
// Con una sola página no muestra nada. cargando y fin son los textos de cada listado
// ("Cargando más eventos…", "Ya viste los 18 eventos").
// Con conBoton (para listas dentro de un ScrollView, como Ventas) la página siguiente se
// pide con un botón "Ver más (quedan N)" en lugar del scroll infinito; onReintentar es
// lo que pide la página siguiente y restantes, cuántos faltan cargar.
export function PieLista({ cargandoMas, errorMas, hayMas, varias, onReintentar, cargando, fin, conBoton = false, restantes }) {
  if (conBoton && hayMas) {
    return (
      <View style={styles.conBoton}>
        {errorMas && !cargandoMas ? <Text style={[styles.texto, styles.centrado]}>{errorMas}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.botonAncho, (pressed || cargandoMas) && styles.presionado]}
          onPress={onReintentar}
          disabled={cargandoMas}
          accessibilityRole="button"
        >
          {cargandoMas ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Text style={styles.botonAnchoTexto}>{cargandoMas ? 'Cargando…' : `Ver más (quedan ${restantes})`}</Text>
        </Pressable>
      </View>
    );
  }
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
  conBoton: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  botonAncho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
  },
  presionado: {
    backgroundColor: colors.primarySoft,
  },
  botonAnchoTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
