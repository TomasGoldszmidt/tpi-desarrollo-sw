import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Menú que abre el chip del usuario: editar el perfil o cerrar sesión.
export function MenuCuenta({ usuario, onEditarPerfil, onCerrarSesion, onCerrar }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar menú">
        {/* Tocar la tarjeta no cierra el menú; tocar afuera, sí. */}
        <Pressable style={styles.tarjeta} onPress={() => {}}>
          <Text style={styles.nombre}>
            {usuario.nombre} {usuario.apellido}
          </Text>
          <Text style={styles.email}>{usuario.email}</Text>

          <Pressable style={styles.opcion} onPress={onEditarPerfil}>
            <Text style={styles.opcionTexto}>Editar perfil</Text>
          </Pressable>
          <Pressable style={styles.opcion} onPress={onCerrarSesion}>
            <Text style={[styles.opcionTexto, styles.peligro]}>Cerrar sesión</Text>
          </Pressable>
          <Pressable style={styles.opcion} onPress={onCerrar}>
            <Text style={[styles.opcionTexto, styles.secundario]}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44, 44, 42, 0.45)',
  },
  tarjeta: {
    width: '80%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  nombre: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  email: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  opcion: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  opcionTexto: {
    color: colors.text,
    fontSize: 16,
  },
  peligro: {
    color: colors.danger,
  },
  secundario: {
    color: colors.textSecondary,
  },
});
