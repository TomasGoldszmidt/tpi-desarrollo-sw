import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../Avatar.js';
import { EstadoBadge } from '../EstadoBadge.js';
import { tieneNoLeidos } from '../AvisoMensaje.js';
import { formatDia } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

export function ConversacionFila({ compra, usuario, elegida, onPress }) {
  const ultimo = compra.mensajes.at(-1);
  const propio = ultimo.usuarioId === usuario.id;
  const noLeida = tieneNoLeidos(compra);
  return (
    <Pressable
      style={({ pressed }) => [styles.fila, elegida && styles.filaElegida, pressed && styles.presionada]}
      onPress={onPress}
    >
      <Avatar usuario={compra.comprador} size={40} />
      <View style={styles.filaInfo}>
        <View style={styles.filaArriba}>
          <Text style={styles.comprador} numberOfLines={1}>
            {compra.comprador.nombre} {compra.comprador.apellido}
          </Text>
          <Text style={styles.fecha}>{formatDia(ultimo.enviado)}</Text>
        </View>
        <View style={styles.filaArriba}>
          <Text style={[styles.ultimo, noLeida && styles.ultimoEspera]} numberOfLines={1}>
            {propio ? 'Vos: ' : ''}
            {ultimo.mensaje}
          </Text>
          {noLeida ? <View style={styles.punto} /> : null}
        </View>
        <View style={styles.compra}>
          <EstadoBadge estado={compra.estado} chico />
          <Text style={styles.detalle}>
            {compra.tipoEntrada.nombre} × {compra.cantidad}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filaElegida: {
    backgroundColor: colors.primarySoft,
  },
  presionada: {
    opacity: 0.7,
  },
  filaInfo: {
    flex: 1,
    gap: 2,
  },
  filaArriba: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comprador: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  fecha: {
    color: colors.textMuted,
    fontSize: 11,
  },
  ultimo: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  ultimoEspera: {
    color: colors.text,
    fontWeight: 'bold',
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  compra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  detalle: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
});
