import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../theme.js';

export function BotonCantidad({ icono, onPress, disabled, label }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.paso, disabled && styles.pasoApagado, pressed && styles.pasoPresionado]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icono} size={22} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  paso: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoApagado: {
    opacity: 0.35,
  },
  pasoPresionado: {
    backgroundColor: colors.primarySoft,
  },
});
