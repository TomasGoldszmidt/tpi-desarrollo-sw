import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Seccion } from '../../components/Seccion.js';
import { colors, fontSize, spacing } from '../../theme.js';

// Caso de uso 4: desde acá el organizador crea un evento.
// La lista de sus eventos con las ventas se completa en la subtarea 3.9 de TAREAS.md.
export default function Eventos() {
  return (
    <Seccion titulo="Mis eventos">
      <Pressable style={styles.boton} onPress={() => router.push('/eventos/nuevo')}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.botonTexto}>Crear evento</Text>
      </Pressable>
    </Seccion>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
