import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Pie de un listado que carga de a páginas (ver usePaginado). Todas las listas de la app
// piden la página siguiente con un botón "Ver más (quedan N)", nunca solas al scrollear:
// - Mientras llega, el botón muestra un spinner, dice "Cargando…" y no se puede tocar.
// - Si falló, arriba del botón va el mensaje y el mismo botón la vuelve a pedir.
// - Sin más páginas, el texto del final ("Ya viste los 18 eventos"); con una sola página, nada.
// onVerMas pide la página siguiente (cargarMas del hook) y restantes es cuántos faltan cargar.
export function PieLista({ cargandoMas, errorMas, hayMas, varias, onVerMas, restantes, fin }) {
  if (hayMas) {
    return (
      <View style={styles.pie}>
        {errorMas && !cargandoMas ? <Text style={[styles.texto, styles.centrado]}>{errorMas}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.boton, (pressed || cargandoMas) && styles.presionado]}
          onPress={onVerMas}
          disabled={cargandoMas}
          accessibilityRole="button"
        >
          {cargandoMas ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Text style={styles.botonTexto}>{cargandoMas ? 'Cargando…' : `Ver más (${restantes === 1 ? 'queda' : 'quedan'} ${restantes})`}</Text>
        </Pressable>
      </View>
    );
  }
  if (varias) {
    return (
      <View style={styles.fin}>
        <Text style={styles.texto}>{fin}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  pie: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  fin: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  texto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  centrado: {
    textAlign: 'center',
  },
  boton: {
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
  botonTexto: {
    color: colors.primaryText,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
