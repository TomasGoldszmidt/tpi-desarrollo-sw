import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNotificaciones } from '../context/NotificacionesContext.js';
import { colors } from '../theme.js';

// Campana del header con la cantidad de notificaciones nuevas. Abre la pantalla de notificaciones.
export function Campana() {
  const { noLeidas } = useNotificaciones();
  const texto = noLeidas > 9 ? '9+' : String(noLeidas);
  return (
    <Pressable
      onPress={() => router.push('/notificaciones')}
      hitSlop={8}
      accessibilityLabel={noLeidas > 0 ? `Notificaciones, ${noLeidas} nuevas` : 'Notificaciones'}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
      {noLeidas > 0 ? (
        <View style={styles.numero}>
          <Text style={styles.numeroTexto}>{texto}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  numero: {
    position: 'absolute',
    top: -4,
    right: -7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
