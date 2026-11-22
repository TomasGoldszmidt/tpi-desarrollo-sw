import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Etiqueta } from '../Etiqueta.js';
import { formatDisponibles, formatPrecio } from '../../format.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Una opción del grupo "Elegí el tipo de entrada": radio, nombre, descripción con las
// disponibles y el precio. Si está agotado no se puede tocar. Al tocarla avisa con onElegir;
// cuál está elegida lo decide la pantalla.
export function TipoEntradaOpcion({ tipo, elegido, onElegir }) {
  const agotado = tipo.disponibles === 0;
  return (
    <Pressable
      style={[styles.opcion, elegido && styles.opcionElegida, agotado && styles.opcionAgotada]}
      onPress={() => onElegir(tipo.id)}
      disabled={agotado}
      accessibilityRole="radio"
      accessibilityState={{ checked: elegido, disabled: agotado }}
    >
      <Ionicons
        name={elegido ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={agotado ? colors.border : elegido ? colors.primary : colors.textMuted}
      />
      <View style={styles.info}>
        <Text style={[styles.nombre, agotado && styles.apagado]}>{tipo.nombre}</Text>
        <Text style={styles.meta}>
          {tipo.descripcion}
          {agotado ? '' : ` · ${formatDisponibles(tipo.disponibles)}`}
        </Text>
      </View>
      {agotado ? (
        <Etiqueta texto="Agotado" fondo={colors.dangerSoft} color={colors.dangerText} />
      ) : (
        <Text style={styles.precio}>{formatPrecio(tipo.precio)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    padding: spacing.md + 2,
    minHeight: 64,
  },
  opcionElegida: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySofter,
  },
  opcionAgotada: {
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  apagado: {
    color: colors.textMuted,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    lineHeight: 18,
  },
  precio: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
});
