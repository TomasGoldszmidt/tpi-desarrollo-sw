import { StyleSheet, Text, View } from 'react-native';
import { formatHora } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Los mensajes propios van a la derecha en verde; los del otro, a la izquierda con su nombre.
export function Burbuja({ mensaje, propio }) {
  return (
    <View style={[styles.burbuja, propio ? styles.propia : styles.ajena]}>
      {!propio ? <Text style={styles.autor}>{mensaje.autor.nombre}</Text> : null}
      <Text style={[styles.mensaje, propio && styles.textoPropio]}>{mensaje.mensaje}</Text>
      <Text style={[styles.hora, propio && styles.textoPropio]}>{formatHora(mensaje.enviado)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  burbuja: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  propia: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  ajena: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  autor: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: 'bold',
  },
  mensaje: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  textoPropio: {
    color: '#FFFFFF',
  },
  hora: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
