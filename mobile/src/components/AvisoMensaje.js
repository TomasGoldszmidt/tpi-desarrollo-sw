import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// El chat de una compra tiene mensajes nuevos cuando la otra persona (comprador ↔
// organizador) escribió después de la última vez que el usuario lo abrió. Lo calcula el
// backend (`mensajesNoLeidos`) y se apaga al abrir el chat.
export function tieneNoLeidos(compra) {
  return compra.mensajesNoLeidos > 0;
}

// El último mensaje de la otra persona, si hay alguno sin leer; si no, null.
export function mensajeNoLeido(compra, usuario) {
  if (!tieneNoLeidos(compra)) return null;
  return [...compra.mensajes].reverse().find((mensaje) => mensaje.usuarioId !== usuario.id) ?? null;
}

// Pie de las tarjetas de Mis compras y Ventas: quién escribió y el comienzo del mensaje,
// sobre un fondo verde claro con el punto de "nuevo".
export function AvisoMensaje({ texto, mensaje }) {
  return (
    <View style={styles.aviso}>
      <View style={styles.punto} />
      <Text style={styles.texto} numberOfLines={2}>
        <Text style={styles.quien}>{texto}</Text>
        {mensaje ? `: ${mensaje}` : null}
      </Text>
    </View>
  );
}

// Estilo de la tarjeta que tiene el aviso: el borde verde la separa de las demás.
export const estiloEsperando = {
  borderColor: colors.primary,
  borderWidth: 1.5,
};

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 10,
    backgroundColor: colors.primarySofter,
  },
  punto: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: colors.primary,
  },
  texto: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 19,
  },
  quien: {
    color: colors.text,
    fontWeight: 'bold',
  },
});
