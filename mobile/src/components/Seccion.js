import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme.js';

// Pantalla de una pestaña: título grande y el contenido abajo. accion: un botón a la
// derecha del título (ej: "Crear" en Mis eventos). En tablet el contenido no pasa de
// 1200 de ancho.
export function Seccion({ titulo, accion = null, children }) {
  return (
    <View style={styles.fondo}>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo} accessibilityRole="header">{titulo}</Text>
          {accion}
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenedor: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.headline,
    fontWeight: 'bold',
  },
});
