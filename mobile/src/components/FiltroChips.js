import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from './Chip.js';
import { colors, spacing } from '../theme.js';

// Chips para filtrar un listado, en una sola línea que se desliza de costado. Es el único
// componente de filtros de la app: las categorías del catálogo, los estados de Mis compras
// y de las ventas de un evento (ver FiltroEstados) y Mis eventos.
// opciones: [{ valor, texto, cantidad?, punto?, puntoActivo?, estiloActivo?: { backgroundColor, color } }]
// valor null = sin filtro. cantidad y punto son opcionales (las categorías no los tienen).
// estiloActivo: los colores al elegirlo (por defecto, el verde de la app); puntoActivo: el
// color del punto con el chip elegido, si tiene que cambiar para verse.
// sangria: el padding horizontal del contenedor; la fila se estira hasta el borde de la
// pantalla para que los chips se deslicen de punta a punta, y arranca alineada con el resto.
// relleno: el margen de los chips a los costados (por defecto, igual a la sangría).
export function FiltroChips({ opciones, elegido, onElegir, sangria = spacing.lg, relleno = sangria, style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={[styles.scroll, { marginHorizontal: -sangria }, style]}
      contentContainerStyle={[styles.fila, { paddingHorizontal: relleno }]}
    >
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
    </ScrollView>
  );
}

const ACTIVO_POR_DEFECTO = { backgroundColor: colors.primary, color: '#FFFFFF' };

const styles = StyleSheet.create({
  // Ni crece ni se achica: arriba de una lista con flex, si no, la lista la aplasta y corta los chips.
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.md,
  },
  fila: {
    gap: spacing.sm,
  },
});
