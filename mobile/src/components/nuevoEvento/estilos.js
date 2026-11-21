import { StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../../theme.js';

// Estilos que comparten la pantalla de crear evento y sus componentes.
export const estilosFormulario = StyleSheet.create({
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
  valor: {
    color: colors.text,
    fontSize: fontSize.body,
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  columna: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
});
