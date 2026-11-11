import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ORDEN_ESTADOS, estiloEstado } from './EstadoBadge.js';
import { colors, fontSize, spacing } from '../theme.js';

// Fila de chips para filtrar compras por estado: "Todas" y un chip por cada estado
// que aparece en las compras, con su cantidad. El elegido toma los colores de su badge.
// elegido es un EstadoCompra o null (Todas). Si el elegido se queda sin compras,
// su chip se sigue mostrando con 0 para que se entienda por qué la lista está vacía.
export function FiltroEstados({ compras, elegido, onElegir }) {
  const cantidades = new Map();
  for (const compra of compras) {
    cantidades.set(compra.estado, (cantidades.get(compra.estado) ?? 0) + 1);
  }
  const estados = ORDEN_ESTADOS.filter((estado) => cantidades.has(estado) || estado === elegido);

  return (
    <View style={styles.contenedor}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
        <Chip
          texto="Todas"
          cantidad={compras.length}
          activo={elegido === null}
          estiloActivo={{ backgroundColor: colors.primary, color: '#FFFFFF' }}
          onPress={() => onElegir(null)}
        />
        {estados.map((estado) => {
          const { plural, fondo, color, borde } = estiloEstado(estado);
          return (
            <Chip
              key={estado}
              texto={plural}
              cantidad={cantidades.get(estado) ?? 0}
              punto={borde}
              activo={elegido === estado}
              estiloActivo={{ backgroundColor: fondo, color }}
              onPress={() => onElegir(estado)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function Chip({ texto, cantidad, punto, activo, estiloActivo, onPress }) {
  const colorTexto = activo ? estiloActivo.color : colors.textSecondary;
  return (
    <Pressable
      style={[styles.chip, activo && { backgroundColor: estiloActivo.backgroundColor, borderColor: 'transparent' }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`${texto}: ${cantidad}`}
    >
      {punto ? <View style={[styles.punto, { backgroundColor: punto }]} /> : null}
      <Text style={[styles.texto, { color: colorTexto }]}>{texto}</Text>
      <Text style={[styles.texto, styles.cantidad, { color: colorTexto }]}>{cantidad}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // La fila llega hasta los bordes de la pantalla, para que se note que se desliza.
  contenedor: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  fila: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
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
