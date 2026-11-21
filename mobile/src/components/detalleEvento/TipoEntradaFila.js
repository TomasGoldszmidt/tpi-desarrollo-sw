import { StyleSheet, Text, View } from 'react-native';
import { Etiqueta } from '../Etiqueta.js';
import { formatDisponibles, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Un tipo de entrada "se está agotando" cuando queda menos del 10 % del cupo.
const quedanPocas = (tipo) => tipo.disponibles > 0 && tipo.disponibles < tipo.cupo * 0.1;

export function TipoEntradaFila({ tipo, ultimo }) {
  const agotado = tipo.disponibles === 0;
  return (
    <View style={[styles.tipo, ultimo && styles.sinBorde]}>
      <View style={styles.flexible}>
        <Text style={[styles.tipoNombre, agotado && styles.apagado]}>{tipo.nombre}</Text>
        <Text style={styles.tipoDescripcion}>{tipo.descripcion}</Text>
      </View>
      <View style={styles.tipoPrecio}>
        <Text style={[styles.tipoNombre, agotado && styles.apagado]}>{formatPrecio(tipo.precio)}</Text>
        {agotado ? (
          <Etiqueta texto="Agotado" fondo={colors.dangerSoft} color={colors.dangerText} />
        ) : quedanPocas(tipo) ? (
          <Text style={styles.pocas}>Quedan pocas · {tipo.disponibles}</Text>
        ) : (
          <Text style={styles.disponibles}>{formatDisponibles(tipo.disponibles)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexible: {
    flex: 1,
  },
  tipo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  sinBorde: {
    borderBottomWidth: 0,
  },
  tipoNombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  tipoDescripcion: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  tipoPrecio: {
    alignItems: 'flex-end',
    gap: 2,
  },
  disponibles: {
    color: colors.primaryText,
    fontSize: fontSize.caption,
  },
  pocas: {
    color: '#8A4B00',
    fontSize: fontSize.caption,
    fontWeight: 'bold',
  },
  apagado: {
    color: colors.textMuted,
  },
});
