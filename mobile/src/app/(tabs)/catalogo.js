import { StyleSheet, Text } from 'react-native';
import { Seccion } from '../../components/Seccion.js';
import { colors } from '../../theme.js';

// Provisoria: se completa en la subtarea 3.3 de TAREAS.md.
export default function Catalogo() {
  return (
    <Seccion titulo="Catálogo">
      <Text style={styles.texto}>Próximamente.</Text>
    </Seccion>
  );
}

const styles = StyleSheet.create({
  texto: {
    color: colors.textSecondary,
  },
});
