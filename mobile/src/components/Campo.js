import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Un campo con su etiqueta arriba y el error (o una ayuda) abajo.
export function Campo({ etiqueta, error, ayuda, style, ...props }) {
  return (
    <View style={[styles.campo, style]}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={etiqueta}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    marginTop: spacing.md,
  },
  etiqueta: {
    color: colors.text,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  ayuda: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
});
