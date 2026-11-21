import { Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../../theme.js';
import { estilosFormulario } from './estilos.js';

export function Selector({ texto, icono, onPress, conError }) {
  return (
    <Pressable
      style={[estilosFormulario.input, styles.selector, conError && estilosFormulario.inputError]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Ionicons name={icono} size={18} color={colors.textSecondary} />
      <Text style={[styles.selectorTexto, texto === 'Elegir' ? styles.placeholder : estilosFormulario.valor]}>{texto}</Text>
      <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectorTexto: {
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
});
