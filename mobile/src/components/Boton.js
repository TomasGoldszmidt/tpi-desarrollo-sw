import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing, TOQUE_MINIMO } from '../theme.js';

// Los únicos botones de la app, siempre iguales:
// - principal: verde lleno, la acción más importante de la pantalla (una sola).
// - secundario: borde verde.
// - texto: sin borde, para acciones menores ("Pagar más tarde", "Limpiar").
// - peligro: texto rojo, nunca lleno (cancelar, cerrar sesión), así no compite con la principal.
// chico: para usar dentro de una tarjeta o en una barra.
export function Boton({ titulo, onPress, variante = 'principal', icono, chico = false, disabled = false, cargando = false, style, accessibilityLabel }) {
  const apagado = disabled || cargando;
  const estilos = VARIANTES[variante];
  const colorTexto = apagado && variante === 'principal' ? colors.textMuted : estilos.texto.color;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.boton,
        chico && styles.chico,
        estilos.boton,
        apagado && variante === 'principal' && styles.apagado,
        pressed && !apagado && estilos.presionado,
        style,
      ]}
      onPress={onPress}
      disabled={apagado}
      accessibilityRole="button"
      accessibilityState={{ disabled: apagado, busy: cargando }}
      accessibilityLabel={accessibilityLabel}
    >
      {cargando ? <ActivityIndicator size="small" color={colorTexto} /> : null}
      {!cargando && icono ? <Ionicons name={icono} size={chico ? 16 : 18} color={colorTexto} /> : null}
      <Text style={[styles.texto, chico && styles.textoChico, estilos.texto, { color: colorTexto }]}>{titulo}</Text>
    </Pressable>
  );
}

const VARIANTES = {
  principal: {
    boton: { backgroundColor: colors.primary },
    texto: { color: '#FFFFFF' },
    presionado: { opacity: 0.85 },
  },
  secundario: {
    boton: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.primary },
    texto: { color: colors.primaryText },
    presionado: { backgroundColor: colors.primarySoft },
  },
  texto: {
    boton: { backgroundColor: 'transparent' },
    texto: { color: colors.primaryText },
    presionado: { backgroundColor: colors.primarySoft },
  },
  peligro: {
    boton: { backgroundColor: 'transparent' },
    texto: { color: colors.danger },
    presionado: { backgroundColor: colors.dangerSoft },
  },
};

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chico: {
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  apagado: {
    backgroundColor: colors.disabled,
  },
  texto: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textoChico: {
    fontSize: fontSize.small,
  },
});

// Para que un ícono o un texto chico se pueda tocar cómodo sin agrandarlo a la vista.
export function hitSlopPara(alto) {
  const falta = Math.max(0, (TOQUE_MINIMO - alto) / 2);
  return { top: falta, bottom: falta, left: 4, right: 4 };
}
