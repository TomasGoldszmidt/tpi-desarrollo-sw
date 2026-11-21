import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../Avatar.js';
import { EstadoBadge } from '../EstadoBadge.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Arriba del chat en la vista dividida: con quién, qué compró y el acceso a la compra.
export function CabeceraChat({ compra }) {
  return (
    <View style={styles.cabecera}>
      <Avatar usuario={compra.comprador} size={32} />
      <View style={styles.filaInfo}>
        <Text style={styles.comprador}>
          {compra.comprador.nombre} {compra.comprador.apellido}
        </Text>
        <Text style={styles.detalle}>
          {compra.tipoEntrada.nombre} × {compra.cantidad}
        </Text>
      </View>
      <EstadoBadge estado={compra.estado} />
      <Pressable onPress={() => router.push(`/compras/${compra.id}`)} hitSlop={12} accessibilityRole="button">
        <Text style={styles.verCompra}>Ver compra</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  filaInfo: {
    flex: 1,
    gap: 2,
  },
  comprador: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  detalle: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  verCompra: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
});
