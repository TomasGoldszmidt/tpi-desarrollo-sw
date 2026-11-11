import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Conversacion } from '../../../components/Conversacion.js';
import { colors, fontSize, spacing } from '../../../theme.js';

// Casos de uso 5 y 6: el chat de una compra, a pantalla completa. Recibe el nombre del
// evento y de con quién se chatea desde quien lo abre (detalle de la compra, mensajes
// del evento o una notificación).
export default function Chat() {
  const { id, evento, con } = useLocalSearchParams();
  return (
    <Conversacion
      compraId={id}
      encabezado={
        <View style={styles.cabecera}>
          <Text style={styles.evento}>{evento}</Text>
          <Text style={styles.con}>Chat con {con}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  cabecera: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  evento: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
  con: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
});
