import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme.js';

// Aviso dentro de un formulario: un error que no es de un campo, o que se guardó.
export function Aviso({ tipo = 'error', children }) {
  if (!children) return null;
  const ok = tipo === 'ok';
  const color = ok ? colors.primaryText : colors.dangerText;
  return (
    <View style={[styles.aviso, ok ? styles.avisoOk : styles.avisoError]} accessibilityRole="alert">
      <Ionicons name={ok ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={18} color={color} />
      <Text style={[styles.avisoTexto, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  avisoTexto: {
    flex: 1,
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  avisoError: {
    backgroundColor: colors.dangerSoft,
  },
  avisoOk: {
    backgroundColor: colors.primarySoft,
  },
});
