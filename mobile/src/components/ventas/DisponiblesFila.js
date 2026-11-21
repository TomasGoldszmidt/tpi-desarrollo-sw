import { StyleSheet, Text, View } from 'react-native';
import { Etiqueta } from '../Etiqueta.js';
import { formatPrecio } from '../../format.js';
import { colors, fontSize } from '../../theme.js';

export function DisponiblesFila({ tipo }) {
  const vendidas = tipo.cupo - tipo.disponibles;
  return (
    <View style={styles.tipo}>
      <View style={styles.tipoArriba}>
        <Text style={styles.tipoNombre}>
          {tipo.nombre} <Text style={styles.cap}>{formatPrecio(tipo.precio)}</Text>
        </Text>
        {tipo.disponibles === 0 ? (
          <Etiqueta texto="Agotado" fondo={colors.dangerSoft} color={colors.dangerText} />
        ) : (
          <Text style={styles.meta}>
            <Text style={styles.fuerte}>{tipo.disponibles}</Text> de {tipo.cupo}
          </Text>
        )}
      </View>
      <View style={styles.barra} accessible accessibilityLabel={`${vendidas} vendidas de ${tipo.cupo}`}>
        <View style={[styles.barraVendida, { width: `${(vendidas / tipo.cupo) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  cap: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    fontWeight: 'normal',
  },
  fuerte: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  tipo: {
    gap: 6,
  },
  tipoArriba: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipoNombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  barra: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.disabled,
    overflow: 'hidden',
  },
  barraVendida: {
    height: '100%',
    backgroundColor: colors.brand,
  },
});
