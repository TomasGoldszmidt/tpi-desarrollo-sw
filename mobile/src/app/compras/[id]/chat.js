import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Conversacion } from '../../../components/Conversacion.js';
import { colors, fontSize, TOQUE_MINIMO } from '../../../theme.js';

// Casos de uso 5 y 6: el chat de una compra, a pantalla completa. Con quién se habla y el
// evento van en la barra de arriba, con un acceso a la compra.
export default function Chat() {
  const { id, evento, con } = useLocalSearchParams();
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.titulo}>
              <Text style={styles.con} numberOfLines={1}>{con}</Text>
              <Text style={styles.evento} numberOfLines={1}>{evento}</Text>
            </View>
          ),
          headerRight: () => (
            <Pressable
              style={styles.verCompra}
              onPress={() => router.push(`/compras/${id}`)}
              accessibilityRole="button"
              accessibilityLabel="Ver la compra"
            >
              <Ionicons name="ticket-outline" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <Conversacion compraId={id} />
    </>
  );
}

const styles = StyleSheet.create({
  titulo: {
    maxWidth: 260,
  },
  con: {
    color: colors.text,
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  evento: {
    color: colors.textSecondary,
    fontSize: fontSize.caption,
  },
  verCompra: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
