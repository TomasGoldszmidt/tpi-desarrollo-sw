import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme.js';

// El chat de una compra espera la respuesta del usuario cuando el último mensaje lo
// escribió la otra persona (comprador ↔ organizador). Es la misma regla que usa el
// backend para `sinResponder` en Mis eventos. No hay "leído": se apaga al contestar.
export function esperaRespuestaDe(compra, usuario) {
  const ultimo = compra.mensajes.at(-1);
  return ultimo !== undefined && ultimo.usuarioId !== usuario.id;
}

// El último mensaje de la compra, si espera la respuesta del usuario; si no, null.
export function mensajeSinResponder(compra, usuario) {
  return esperaRespuestaDe(compra, usuario) ? compra.mensajes.at(-1) : null;
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
