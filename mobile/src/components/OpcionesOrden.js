import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme.js';

// Los valores de orden que acepta GET /eventos. El primero es el de por defecto.
export const ORDENES = [
  { valor: 'fecha', etiqueta: 'Fecha', detalle: 'Los más próximos primero' },
  { valor: 'precio', etiqueta: 'Precio', detalle: 'Los más baratos primero' },
  { valor: 'puntaje', etiqueta: 'Puntaje del organizador', detalle: 'Los mejor reseñados primero' },
];

// También los usa el panel lateral del catálogo en tablet horizontal.
export function OpcionesOrden({ orden, onElegir }) {
  return (
    <View accessibilityRole="radiogroup">
      <Text style={styles.etiqueta}>Ordenar por</Text>
      {ORDENES.map((opcion, i) => {
        const elegida = orden === opcion.valor;
        return (
          <Pressable
            key={opcion.valor}
            style={[styles.opcion, i === ORDENES.length - 1 && styles.sinBorde]}
            onPress={() => onElegir(opcion.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegida }}
          >
            <View style={styles.opcionTextos}>
              <Text style={[styles.opcionTexto, elegida && styles.negrita]}>{opcion.etiqueta}</Text>
              <Text style={styles.detalle}>{opcion.detalle}</Text>
            </View>
            <Ionicons
              name={elegida ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={elegida ? colors.primary : colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  sinBorde: {
    borderBottomWidth: 0,
  },
  opcionTextos: {
    flex: 1,
  },
  opcionTexto: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  negrita: {
    fontWeight: 'bold',
  },
  detalle: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
});
