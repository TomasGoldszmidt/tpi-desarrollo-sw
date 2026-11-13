import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from './Boton.js';
import { colors, fontSize, spacing } from '../theme.js';

// Piezas de los formularios de cuenta (inicio de sesión, registro y perfil).

export const emailValido = (texto) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto.trim());
export const MIN_CONTRASENIA = 8;

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

// Campo de contraseña con el ojo para verla.
// ref llega al TextInput (React 19 pasa ref como prop), para enfocarlo desde el campo anterior.
export function CampoContrasenia({ etiqueta, error, ayuda, ayudaCumplida = false, ref, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={[styles.input, styles.conBoton, error && styles.inputError]}>
        <TextInput
          ref={ref}
          style={styles.inputPelado}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={etiqueta}
          {...props}
        />
        <Pressable
          onPress={() => setVisible(!visible)}
          style={styles.ojo}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : ayuda ? (
        // La regla se ve siempre y se tilda al cumplirla.
        <View style={styles.ayudaFila}>
          {ayudaCumplida ? <Ionicons name="checkmark" size={14} color={colors.primaryText} /> : null}
          <Text style={[styles.ayuda, styles.ayudaSinMargen, ayudaCumplida && styles.ayudaCumplida]}>{ayuda}</Text>
        </View>
      ) : null}
    </View>
  );
}

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

export function BotonPrincipal({ titulo, onPress, disabled }) {
  return <Boton titulo={titulo} onPress={onPress} disabled={disabled} style={styles.boton} />;
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
  conBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingRight: 0,
  },
  inputPelado: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.text,
  },
  ojo: {
    width: 48,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
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
  ayudaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  ayudaSinMargen: {
    marginTop: 0,
  },
  ayudaCumplida: {
    color: colors.primaryText,
  },
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
  boton: {
    marginTop: spacing.xl,
  },
});
