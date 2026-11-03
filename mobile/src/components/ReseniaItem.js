import { StyleSheet, Text, View } from 'react-native';
import { Estrellas } from './Estrellas.js';
import { formatMesAnio } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Una reseña (ReseniaDetalle de la API): puntuación, quién la escribió, comentario y evento.
export function ReseniaItem({ resenia }) {
  return (
    <View style={styles.item}>
      <View style={styles.arriba}>
        <View style={styles.puntuacion}>
          <Estrellas valor={resenia.puntuacion} />
          <Text style={styles.numero}>{resenia.puntuacion}</Text>
        </View>
        <Text style={styles.autor}>
          {resenia.comprador.nombre} {resenia.comprador.apellido}
        </Text>
      </View>
      <Text style={styles.detalle}>{resenia.detalle}</Text>
      <Text style={styles.evento}>
        {resenia.evento.nombre} · {formatMesAnio(resenia.evento.fecha)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  arriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puntuacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  numero: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  autor: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  detalle: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  evento: {
    color: colors.textMuted,
    fontSize: fontSize.small,
  },
});
