import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Estrellas } from './Estrellas.js';
import { formatDia } from '../format.js';
import { colors, fontSize, spacing } from '../theme.js';

// Una reseña larga se corta en 4 renglones y se abre con "Leer más".
const LARGO_PARA_CORTAR = 180;

// Una reseña (ReseniaDetalle de la API): quién la escribió y su puntuación, el evento con
// su fecha y el comentario.
export function ReseniaItem({ resenia }) {
  const [abierta, setAbierta] = useState(false);
  const larga = resenia.detalle.length > LARGO_PARA_CORTAR;
  return (
    <View style={styles.item}>
      <View style={styles.arriba}>
        <Text style={styles.autor}>
          {resenia.comprador.nombre} {resenia.comprador.apellido}
        </Text>
        <Estrellas valor={resenia.puntuacion} size={15} />
      </View>
      <Text style={styles.evento}>
        {resenia.evento.nombre} · {formatDia(resenia.evento.fecha)}
      </Text>
      <Text style={styles.detalle} numberOfLines={larga && !abierta ? 4 : undefined}>
        {resenia.detalle}
      </Text>
      {larga ? (
        <Pressable onPress={() => setAbierta(!abierta)} hitSlop={10} accessibilityRole="button">
          <Text style={styles.leerMas}>{abierta ? 'Leer menos' : 'Leer más'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: 2,
  },
  arriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autor: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  evento: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginBottom: spacing.xs,
  },
  detalle: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 22,
  },
  leerMas: {
    color: colors.primaryText,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
});
