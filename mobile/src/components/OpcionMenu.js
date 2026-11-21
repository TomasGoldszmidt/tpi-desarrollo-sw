import { Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme.js';

// Una opción del menú de la cuenta. peligro: en rojo y sin flecha (cerrar sesión).
export function OpcionMenu({ icono, texto, onPress, peligro = false }) {
  const color = peligro ? colors.danger : colors.text;
  return (
    <Pressable
      style={({ pressed }) => [styles.opcion, pressed && styles.presionada]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Ionicons name={icono} size={22} color={peligro ? colors.danger : colors.textSecondary} />
      <Text style={[styles.opcionTexto, { color }, peligro && styles.negrita]}>{texto}</Text>
      {!peligro ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  presionada: {
    backgroundColor: colors.surface,
  },
  opcionTexto: {
    flex: 1,
    fontSize: fontSize.body,
  },
  negrita: {
    fontWeight: 'bold',
  },
});
