import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../../theme.js';

// Ícono y colores de cada tipo; los cambios de estado según el estado nuevo.
const ICONOS = {
  MENSAJE: { nombre: 'chatbubble-outline', fondo: '#E6F1FB', color: '#0C447C' },
  COMPRA: { nombre: 'ticket-outline', fondo: '#EAF3DE', color: '#27500A' },
  CONFIRMADA: { nombre: 'checkmark', fondo: '#EAF3DE', color: '#27500A' },
  UTILIZADA: { nombre: 'checkmark-done', fondo: '#F1EFE8', color: '#444441' },
  CANCELADA: { nombre: 'arrow-undo-outline', fondo: '#FCEBEB', color: '#791F1F' },
  REEMBOLSADA: { nombre: 'arrow-undo-outline', fondo: '#FCEBEB', color: '#791F1F' },
  RESENIA: { nombre: 'star-outline', fondo: '#FAEEDA', color: '#633806' },
};

// El texto de la notificación: las partes en negrita son quién y el evento.
function partes(notificacion) {
  const { tipo, estado, compra } = notificacion;
  const entradas = compra ? `${compra.cantidad} ${compra.tipoEntrada}` : '';
  if (tipo === 'MENSAJE') return ['te escribió sobre', `: “${notificacion.mensaje}”`];
  if (tipo === 'RESENIA') {
    const estrellas = notificacion.puntuacion === 1 ? '1 estrella' : `${notificacion.puntuacion} estrellas`;
    return ['reseñó', ` con ${estrellas}`];
  }
  if (tipo === 'COMPRA') return [`compró ${entradas} para`, ''];
  if (estado === 'CONFIRMADA') return [`pagó ${entradas} para`, ''];
  if (estado === 'CANCELADA') return ['canceló su compra de', ''];
  if (estado === 'REEMBOLSADA') return ['canceló su compra de', ' y se le reembolsó'];
  if (estado === 'UTILIZADA') return ['marcó como utilizada tu compra de', ''];
  return ['cambió la compra de', ''];
}

export function NotificacionFila({ notificacion, onPress }) {
  const icono = ICONOS[notificacion.tipo === 'CAMBIO_ESTADO' ? notificacion.estado : notificacion.tipo] ?? ICONOS.COMPRA;
  const [antes, despues] = partes(notificacion);
  const nueva = !notificacion.leida;
  return (
    <Pressable
      style={({ pressed }) => [styles.fila, nueva && styles.nueva, pressed && styles.presionada]}
      onPress={onPress}
    >
      <View style={[styles.icono, { backgroundColor: icono.fondo }]}>
        <Ionicons name={icono.nombre} size={18} color={icono.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.texto}>
          <Text style={styles.fuerte}>
            {notificacion.de.nombre} {notificacion.de.apellido}
          </Text>{' '}
          {antes} <Text style={styles.fuerte}>{notificacion.evento.nombre}</Text>
          <Text style={notificacion.tipo === 'MENSAJE' ? styles.cita : null}>{despues}</Text>
        </Text>
        <Text style={styles.cuando}>{notificacion.cuando}</Text>
      </View>
      {nueva ? <View style={styles.punto} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: 12,
  },
  nueva: {
    backgroundColor: colors.primarySofter,
  },
  presionada: {
    backgroundColor: colors.primarySoft,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  texto: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 19,
  },
  fuerte: {
    fontWeight: 'bold',
  },
  cita: {
    color: colors.textSecondary,
  },
  cuando: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignSelf: 'center',
  },
});
