import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Piezas de los formularios de cuenta (inicio de sesión, registro y perfil).

export const emailValido = (texto) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto.trim());
export const MIN_CONTRASENIA = 8;

// Etiqueta, campo y, si hay, el error debajo (con el borde en rojo).
export function Campo({ etiqueta, error, ayuda, style, ...props }) {
  return (
    <View style={[styles.campo, style]}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

// Campo de contraseña con "Mostrar / Ocultar".
export function CampoContrasenia({ etiqueta, error, ayuda, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={[styles.input, styles.conBoton, error && styles.inputError]}>
        <TextInput
          style={styles.inputPelado}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textMuted}
          {...props}
        />
        <Pressable onPress={() => setVisible(!visible)} hitSlop={8}>
          <Text style={styles.mostrar}>{visible ? 'Ocultar' : 'Mostrar'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

// Recuadro arriba del formulario: el error que devolvió el backend o la confirmación.
export function Aviso({ tipo = 'error', children }) {
  if (!children) return null;
  return <Text style={[styles.aviso, tipo === 'ok' ? styles.avisoOk : styles.avisoError]}>{children}</Text>;
}

export function BotonPrincipal({ titulo, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]} onPress={onPress}>
      <Text style={styles.botonTexto}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  campo: {
    marginTop: spacing.md,
  },
  etiqueta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.danger,
  },
  conBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  inputPelado: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
  },
  mostrar: {
    color: colors.primary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },
  ayuda: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
  },
  aviso: {
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.body,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  avisoError: {
    backgroundColor: '#FCEBEB',
    color: '#791F1F',
  },
  avisoOk: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryText,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
