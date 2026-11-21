import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EstadoBadge, ESTADOS_INACTIVOS } from '../EstadoBadge.js';
import { AvisoMensaje, mensajeNoLeido } from '../AvisoMensaje.js';
import { formatDia, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

export function VentaCard({ compra, usuario, onPress }) {
  const inactiva = ESTADOS_INACTIVOS.includes(compra.estado);
  const noLeido = mensajeNoLeido(compra, usuario);
  const creada = compra.historial[0].fechaHora;

  return (
    <Pressable style={({ pressed }) => [styles.venta, pressed && styles.presionada]} onPress={onPress} accessibilityRole="button">
      <View style={styles.ventaFila}>
        <Text style={styles.comprador}>
          {compra.comprador.nombre} {compra.comprador.apellido}
        </Text>
        <Text style={[styles.total, inactiva && styles.tachado]}>{formatPrecio(compra.total)}</Text>
      </View>
      <View style={styles.ventaFila}>
        <Text style={styles.meta}>
          {compra.tipoEntrada.nombre} × {compra.cantidad} · {formatDia(creada)}
        </Text>
        <EstadoBadge estado={compra.estado} />
      </View>
      {noLeido ? <AvisoMensaje texto={`${compra.comprador.nombre} te escribió`} mensaje={noLeido.mensaje} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  venta: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: spacing.xs,
  },
  ventaFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  presionada: {
    backgroundColor: colors.primarySofter,
  },
  comprador: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  total: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  tachado: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
