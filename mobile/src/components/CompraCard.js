import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from './Boton.js';
import { EstadoBadge, ESTADOS_INACTIVOS } from './EstadoBadge.js';
import { Etiqueta } from './Etiqueta.js';
import { AvisoMensaje, estiloEsperando, mensajeNoLeido } from './AvisoMensaje.js';
import { formatDiasRestantes, formatFecha, formatPrecio } from '../format.js';
import { colors, fontSize, spacing, TOQUE_MINIMO } from '../theme.js';

// Una compra del comprador (CompraDetalle de la API), caso de uso 1: estado con ícono, los
// días que faltan si está confirmada, evento, entradas y total. Si el organizador escribió
// algo que no se leyó, abajo lo avisa.
// onPagar: en las pendientes, el botón "Pagar" a mano sin entrar al detalle.
// onChat: el botón de la derecha abre el chat; el número es cuántos mensajes no leyó.
export function CompraCard({ compra, usuario, organizador, onPress, onChat, onPagar }) {
  const confirmada = compra.estado === 'CONFIRMADA';
  const pendiente = compra.estado === 'PENDIENTE';
  const inactiva = ESTADOS_INACTIVOS.includes(compra.estado);
  const noLeido = mensajeNoLeido(compra, usuario);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, noLeido && estiloEsperando, pressed && styles.presionada]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.fila, inactiva && styles.inactiva]}>
        <View style={styles.info}>
          <View style={styles.arriba}>
            <EstadoBadge estado={compra.estado} />
            {confirmada ? (
              compra.diasRestantes === null ? (
                <Text style={styles.pasado}>{formatDiasRestantes(null)}</Text>
              ) : (
                <Etiqueta texto={formatDiasRestantes(compra.diasRestantes)} fondo={colors.primarySofter} color={colors.primaryText} />
              )
            ) : null}
          </View>
          <Text style={styles.nombre}>{compra.evento.nombre}</Text>
          <Text style={styles.meta}>
            {formatFecha(compra.evento.fecha)} · {compra.tipoEntrada.nombre} × {compra.cantidad}
          </Text>
        </View>
        {onChat ? (
          <Pressable
            style={({ pressed }) => [styles.chat, pressed && styles.chatPresionado]}
            onPress={onChat}
            accessibilityRole="button"
            accessibilityLabel={compra.mensajesNoLeidos > 0 ? `Chat, ${compra.mensajesNoLeidos} sin leer` : 'Chat'}
          >
            <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
            {compra.mensajesNoLeidos > 0 ? (
              <View style={styles.numero}>
                <Text style={styles.numeroTexto}>{compra.mensajesNoLeidos}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.abajo, inactiva && styles.inactiva]}>
        <Text style={[styles.total, inactiva && styles.tachado]}>{formatPrecio(compra.total)}</Text>
        {pendiente && onPagar ? <Boton titulo="Pagar" chico onPress={onPagar} accessibilityLabel={`Pagar ${formatPrecio(compra.total)}`} /> : null}
      </View>
      {noLeido ? (
        <AvisoMensaje texto={`${organizador ? organizador.nombre : 'El organizador'} te escribió`} mensaje={noLeido.mensaje} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  presionada: {
    backgroundColor: colors.primarySofter,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  inactiva: {
    opacity: 0.65,
  },
  arriba: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pasado: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  chat: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  chatPresionado: {
    backgroundColor: colors.primarySoft,
  },
  numero: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
  },
  numeroTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  abajo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
    marginTop: spacing.sm,
  },
  total: {
    color: colors.text,
    fontSize: fontSize.large + 1,
    fontWeight: 'bold',
  },
  tachado: {
    textDecorationLine: 'line-through',
  },
});
