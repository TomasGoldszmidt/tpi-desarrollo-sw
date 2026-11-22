import { StyleSheet, Text, View } from 'react-native';
import { BotonCantidad } from './BotonCantidad.js';
import { formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// El "− 3 +" de la compra. Va de 1 a maximo (las disponibles del tipo elegido): en el tope
// se apaga el + y dice "Máximo". Cada toque avisa la cantidad nueva con onCambiar; el
// número lo guarda la pantalla.
export function SelectorCantidad({ cantidad, maximo, precio, onCambiar }) {
  const enElMaximo = cantidad >= maximo;
  return (
    <View style={styles.fila}>
      <BotonCantidad icono="remove" onPress={() => onCambiar(cantidad - 1)} disabled={cantidad <= 1} label="Una entrada menos" />
      <Text style={styles.numero} accessibilityLiveRegion="polite">{cantidad}</Text>
      <BotonCantidad icono="add" onPress={() => onCambiar(cantidad + 1)} disabled={enElMaximo} label="Una entrada más" />
      <Text style={styles.meta}>{enElMaximo ? `Máximo ${maximo}` : `${cantidad} × ${formatPrecio(precio)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  numero: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
    minWidth: 28,
    textAlign: 'center',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 18,
  },
});
