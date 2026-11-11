import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme.js';

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

// Pie de las tarjetas de Mis compras y Ventas: quién escribió y el comienzo del mensaje.
export function AvisoMensaje({ texto, mensaje }) {
  return (
    <View style={styles.aviso}>
      <View style={styles.punto} />
      <Text style={styles.texto} numberOfLines={1}>
        {texto}
        {mensaje ? <Text style={styles.mensaje}> · {mensaje}</Text> : null}
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
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  texto: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  mensaje: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
});
