import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EstadoBadge, ESTADOS_INACTIVOS, estiloEstado } from './EstadoBadge.js';
import { AvisoMensaje, estiloEsperando, mensajeNoLeido } from './AvisoMensaje.js';
import { formatDiasRestantes, formatFecha, formatPrecio } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Una compra del comprador (CompraDetalle de la API): estado, evento, entradas y total.
// Si el organizador escribió algo que no leyó, abajo lo avisa. Sin su nombre, dice "El organizador".
// onChat: el botón de la derecha abre el chat sin pasar por el detalle (como en Mis eventos);
// el número es cuántos mensajes no leyó. Sin onChat no hay botón.
export function CompraCard({ compra, usuario, organizador, onPress, onChat }) {
  const confirmada = compra.estado === 'CONFIRMADA';
  const inactiva = ESTADOS_INACTIVOS.includes(compra.estado);
  const noLeido = mensajeNoLeido(compra, usuario);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: estiloEstado(compra.estado).borde },
        noLeido && estiloEsperando,
        inactiva && styles.inactiva,
        pressed && styles.presionada,
      ]}
      onPress={onPress}
    >
      <View style={styles.fila}>
        <View style={styles.info}>
          <View style={styles.arriba}>
            <EstadoBadge estado={compra.estado} />
            {confirmada ? (
              <Text style={[styles.dias, compra.diasRestantes === null && styles.diasPasado]}>
                {formatDiasRestantes(compra.diasRestantes)}
              </Text>
            ) : null}
          </View>
          <Text style={styles.nombre}>{compra.evento.nombre}</Text>
          <Text style={styles.meta}>
            {formatFecha(compra.evento.fecha)} · {compra.tipoEntrada.nombre} × {compra.cantidad}
          </Text>
          <View style={styles.abajo}>
            <Text style={styles.meta}>{compra.estado === 'PENDIENTE' ? 'Pagala para confirmarla' : ''}</Text>
            <Text style={styles.total}>{formatPrecio(compra.total)}</Text>
          </View>
          {noLeido ? (
            <AvisoMensaje
              texto={`${organizador ? organizador.nombre : 'El organizador'} te escribió`}
              mensaje={noLeido.mensaje}
            />
          ) : null}
        </View>
        {onChat ? (
          <Pressable
            style={({ pressed }) => [styles.chat, pressed && styles.chatPresionado]}
            onPress={onChat}
            hitSlop={6}
            accessibilityLabel={compra.mensajesNoLeidos > 0 ? `Chat, ${compra.mensajesNoLeidos} sin leer` : 'Chat'}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
            {compra.mensajesNoLeidos > 0 ? (
              <View style={styles.numero}>
                <Text style={styles.numeroTexto}>{compra.mensajesNoLeidos}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  chat: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  chatPresionado: {
    backgroundColor: colors.primarySoft,
  },
  numero: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inactiva: {
    opacity: 0.6,
  },
  presionada: {
    backgroundColor: colors.primarySoft,
  },
  arriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dias: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  diasPasado: {
    color: colors.textMuted,
    fontWeight: 'normal',
  },
  nombre: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  abajo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
