import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Avatar } from './Avatar.js';
import { colors, fontSize, spacing } from '../theme.js';

// Menú de la cuenta: una hoja que sube desde abajo (al alcance del pulgar) y se cierra
// tocando afuera. Editar el perfil, ver las reseñas de mis eventos y cerrar sesión, que
// pide confirmación.
export function MenuCuenta({ usuario, onEditarPerfil, onVerResenias, onCerrarSesion, onCerrar }) {
  const insets = useSafeAreaInsets();

  function confirmarSalida() {
    Alert.alert('¿Cerrar sesión?', 'Vas a tener que volver a ingresar con tu email y contraseña.', [
      { text: 'Volver', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: onCerrarSesion },
    ]);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar menú" />
      <View style={[styles.hoja, { paddingBottom: spacing.lg + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.agarre} />
        <View style={styles.persona}>
          <Avatar usuario={usuario} size={48} />
          <View style={styles.personaTexto}>
            <Text style={styles.nombre}>
              {usuario.nombre} {usuario.apellido}
            </Text>
            <Text style={styles.email}>{usuario.email}</Text>
          </View>
        </View>

        <Opcion icono="person-outline" texto="Editar perfil" onPress={onEditarPerfil} />
        <Opcion icono="star-outline" texto="Reseñas de mis eventos" onPress={onVerResenias} />
        <Opcion icono="log-out-outline" texto="Cerrar sesión" onPress={confirmarSalida} peligro />
      </View>
    </Modal>
  );
}

function Opcion({ icono, texto, onPress, peligro = false }) {
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
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 28, 0.45)',
  },
  hoja: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  agarre: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  persona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  personaTexto: {
    flex: 1,
  },
  nombre: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  email: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
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
