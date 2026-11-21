import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EstadoBadge } from '../EstadoBadge.js';
import { mensajeNoLeido } from '../AvisoMensaje.js';
import { formatDia, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

export function VentaFila({ compra, usuario, onPress }) {
  const noLeido = mensajeNoLeido(compra, usuario);
  return (
    <Pressable
      style={({ pressed }) => [styles.filaTabla, noLeido && styles.filaNueva, pressed && styles.presionada]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.colComprador, styles.celdaComprador]}>
        {noLeido ? <View style={styles.punto} accessibilityLabel="Mensaje sin leer" /> : null}
        <Text style={styles.fuerte}>
          {compra.comprador.nombre} {compra.comprador.apellido}
        </Text>
      </View>
      <Text style={[styles.td, styles.colEntradas]}>
        {compra.tipoEntrada.nombre} × {compra.cantidad}
      </Text>
      <Text style={[styles.td, styles.colFecha]}>{formatDia(compra.historial[0].fechaHora)}</Text>
      <View style={styles.colEstado}>
        <EstadoBadge estado={compra.estado} />
      </View>
      <Text style={[styles.td, styles.colTotal, styles.fuerte]}>{formatPrecio(compra.total)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fuerte: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  presionada: {
    backgroundColor: colors.primarySofter,
  },
  filaTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  filaNueva: {
    backgroundColor: colors.primarySofter,
  },
  td: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  celdaComprador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  punto: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  colComprador: {
    flex: 2.2,
  },
  colEntradas: {
    flex: 1.4,
  },
  colFecha: {
    flex: 1.2,
  },
  colEstado: {
    flex: 1.6,
  },
  colTotal: {
    flex: 1.1,
    textAlign: 'right',
  },
});
