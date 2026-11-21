import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './Avatar.js';
import { OpcionMenu } from './OpcionMenu.js';
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

        <OpcionMenu icono="person-outline" texto="Editar perfil" onPress={onEditarPerfil} />
        <OpcionMenu icono="star-outline" texto="Reseñas de mis eventos" onPress={onVerResenias} />
        <OpcionMenu icono="log-out-outline" texto="Cerrar sesión" onPress={confirmarSalida} peligro />
      </View>
    </Modal>
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
});
