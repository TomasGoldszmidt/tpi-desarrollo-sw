import { StyleSheet, Text } from 'react-native';
import { Seccion } from '../../components/Seccion.js';
import { colors } from '../../theme.js';

// Provisoria: se completa en las subtareas 3.8 y 3.9 de TAREAS.md.
export default function Eventos() {
  return (
    <Seccion titulo="Mis eventos">
      <Text style={styles.texto}>Próximamente.</Text>
    </Seccion>
  );
}

const styles = StyleSheet.create({
  texto: {
    color: colors.textSecondary,
  },
});
