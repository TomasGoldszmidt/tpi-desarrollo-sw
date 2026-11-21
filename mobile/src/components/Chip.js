import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '../theme.js';

// Un chip de FiltroChips.
export function Chip({ texto, cantidad, punto, puntoActivo, activo, estiloActivo, onPress }) {
  const colorTexto = activo ? estiloActivo.color : colors.text;
  const conCantidad = cantidad !== undefined;
  return (
    <Pressable
      style={[styles.chip, activo && { backgroundColor: estiloActivo.backgroundColor, borderColor: 'transparent' }]}
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={conCantidad ? `${texto}: ${cantidad}` : texto}
    >
      {punto ? <View style={[styles.punto, { backgroundColor: activo && puntoActivo ? puntoActivo : punto }]} /> : null}
      <Text style={[styles.texto, activo && styles.textoActivo, { color: colorTexto }]}>{texto}</Text>
      {conCantidad ? <Text style={[styles.texto, styles.cantidad, { color: colorTexto }]}>{cantidad}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    minHeight: 36,
    paddingHorizontal: 14,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    fontSize: fontSize.small,
  },
  textoActivo: {
    fontWeight: 'bold',
  },
  cantidad: {
    fontWeight: 'bold',
  },
});
