import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Chips para filtrar un listado (en uno o más renglones). Cada opción tiene un valor
// (null = sin filtro), un texto, su cantidad y, opcional, un punto de color y los colores
// que toma al elegirla (por defecto, el verde de la app). Los usan Mis compras (por estado)
// y Mis eventos (próximos, realizados, con mensajes nuevos).
// opciones: [{ valor, texto, cantidad, punto?, puntoActivo?, estiloActivo?: { backgroundColor, color } }]
// puntoActivo: el color del punto con el chip elegido, si tiene que cambiar para verse.
export function FiltroChips({ opciones, elegido, onElegir }) {
  return (
    <View style={styles.fila}>
      {opciones.map((opcion) => (
        <Chip
          key={opcion.valor ?? 'todos'}
          texto={opcion.texto}
          cantidad={opcion.cantidad}
          punto={opcion.punto}
          puntoActivo={opcion.puntoActivo}
          activo={elegido === opcion.valor}
          estiloActivo={opcion.estiloActivo ?? ACTIVO_POR_DEFECTO}
          onPress={() => onElegir(opcion.valor)}
        />
      ))}
    </View>
  );
}

const ACTIVO_POR_DEFECTO = { backgroundColor: colors.primary, color: '#FFFFFF' };

function Chip({ texto, cantidad, punto, puntoActivo, activo, estiloActivo, onPress }) {
  const colorTexto = activo ? estiloActivo.color : colors.textSecondary;
  return (
    <Pressable
      style={[styles.chip, activo && { backgroundColor: estiloActivo.backgroundColor, borderColor: 'transparent' }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`${texto}: ${cantidad}`}
    >
      {punto ? <View style={[styles.punto, { backgroundColor: activo && puntoActivo ? puntoActivo : punto }]} /> : null}
      <Text style={[styles.texto, { color: colorTexto }]}>{texto}</Text>
      <Text style={[styles.texto, styles.cantidad, { color: colorTexto }]}>{cantidad}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Si no entran en un renglón, los chips pasan al de abajo: así se ven todos sin deslizar.
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    fontSize: fontSize.body,
  },
  cantidad: {
    fontWeight: 'bold',
  },
});
