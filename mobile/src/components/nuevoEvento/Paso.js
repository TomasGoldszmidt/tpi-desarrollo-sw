import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme.js';

// Encabezado de cada bloque del formulario, numerado.
export function Paso({ numero, titulo, opcional = false }) {
  return (
    <View style={styles.paso}>
      <View style={styles.pasoNumero}>
        <Text style={styles.pasoNumeroTexto}>{numero}</Text>
      </View>
      <Text style={styles.pasoTitulo} accessibilityRole="header">
        {titulo}
        {opcional ? <Text style={styles.opcional}>  opcional</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  paso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  pasoNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoNumeroTexto: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  pasoTitulo: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  opcional: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    fontWeight: 'normal',
  },
});
