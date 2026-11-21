import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Rangos rápidos de precio (precioMin y precioMax de GET /eventos). El primero es "sin filtro".
export const PRECIOS = [
  { valor: 'cualquiera', etiqueta: 'Cualquiera' },
  { valor: 'hasta10', etiqueta: 'Hasta $ 10.000', precioMax: 10000 },
  { valor: 'de10a25', etiqueta: '$ 10.000 a $ 25.000', precioMin: 10000, precioMax: 25000 },
  { valor: 'mas25', etiqueta: 'Más de $ 25.000', precioMin: 25000 },
];

// También lo usa el panel lateral del catálogo en tablet horizontal.
export function OpcionesPrecio({ precio, onElegir }) {
  return (
    <View style={styles.chips}>
      {PRECIOS.map((opcion) => {
        const elegida = precio === opcion.valor;
        return (
          <Pressable
            key={opcion.valor}
            style={[styles.chip, elegida && styles.chipElegido]}
            onPress={() => onElegir(opcion.valor)}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegida }}
          >
            <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>{opcion.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  chipElegido: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    color: colors.text,
    fontSize: fontSize.small,
  },
  chipTextoElegido: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
