import { StyleSheet, Text } from 'react-native';
import { Seccion } from '../../components/Seccion.js';
import { colors } from '../../theme.js';

// Provisoria: se completa en la subtarea 3.6 de TAREAS.md.
export default function Compras() {
  return (
    <Seccion titulo="Mis compras">
      <Text style={styles.texto}>Próximamente.</Text>
    </Seccion>
  );
}

const styles = StyleSheet.create({
  texto: {
    color: colors.textSecondary,
  },
});
