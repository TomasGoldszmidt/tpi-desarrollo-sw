import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Etiqueta } from '../Etiqueta.js';
import { estiloEsperando } from '../AvisoMensaje.js';
import { formatFecha } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

export function EventoFila({ evento, onPress }) {
  // Del lugar se muestra solo el nombre, sin la dirección.
  const lugar = evento.lugar.split(',')[0];
  // Compras del evento con mensajes que el organizador no leyó (lo calcula el backend).
  const { conMensajesNoLeidos, realizado } = evento;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, conMensajesNoLeidos > 0 && estiloEsperando, pressed && styles.presionada]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.fila}>
        {evento.imagen ? (
          <Image source={{ uri: evento.imagen }} style={[styles.imagen, realizado && styles.apagada]} />
        ) : (
          <View style={styles.imagen} />
        )}
        <View style={styles.info}>
          {realizado ? (
            <Etiqueta texto="Realizado" icono="checkmark-done" fondo="#F1EFE8" color="#444441" />
          ) : (
            <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
          )}
          <Text style={styles.nombre}>{evento.nombre}</Text>
          <Text style={styles.meta}>
            {formatFecha(evento.fecha)} · {lugar}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
      {/* Abre los mensajes del evento sin pasar por Ventas. */}
      {conMensajesNoLeidos > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.mensajes, pressed && styles.mensajesPresionado]}
          onPress={() => router.push(`/eventos/${evento.id}/mensajes`)}
          accessibilityRole="button"
        >
          <View style={styles.punto} />
          <Text style={styles.mensajesTexto}>
            <Text style={styles.negrita}>{conMensajesNoLeidos === 1 ? '1 chat' : `${conMensajesNoLeidos} chats`}</Text> con mensajes nuevos
          </Text>
          <Text style={styles.verMensajes}>Ver mensajes</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  presionada: {
    backgroundColor: colors.primarySofter,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  imagen: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.borderSoft,
  },
  apagada: {
    opacity: 0.55,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  categoria: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  mensajes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySofter,
    borderTopWidth: 1,
    borderTopColor: '#DCE9CC',
  },
  mensajesPresionado: {
    backgroundColor: colors.primarySoft,
  },
  punto: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  mensajesTexto: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.small,
  },
  negrita: {
    fontWeight: 'bold',
  },
  verMensajes: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
});
