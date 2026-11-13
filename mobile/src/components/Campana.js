import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNotificaciones } from '../context/NotificacionesContext.js';
import { colors, TOQUE_MINIMO } from '../theme.js';

// Campana con la cantidad de notificaciones nuevas. Abre la pantalla de notificaciones.
// El contador es verde: avisar algo nuevo no es un error. Sin alto fijo, así crece con la letra.
// conTexto: en la barra lateral de la tablet lleva el nombre abajo.
export function Campana({ conTexto = false, color = colors.textSecondary }) {
  const { noLeidas } = useNotificaciones();
  const texto = noLeidas > 9 ? '9+' : String(noLeidas);
  return (
    <Pressable
      style={styles.boton}
      onPress={() => router.push('/notificaciones')}
      accessibilityRole="button"
      accessibilityLabel={noLeidas > 0 ? `Notificaciones, ${noLeidas} nuevas` : 'Notificaciones'}
    >
      <View>
        <Ionicons name="notifications-outline" size={24} color={color} />
        {noLeidas > 0 ? (
          <View style={styles.numero}>
            <Text style={styles.numeroTexto}>{texto}</Text>
          </View>
        ) : null}
      </View>
      {conTexto ? <Text style={[styles.etiqueta, { color }]}>Avisos</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minWidth: TOQUE_MINIMO,
    minHeight: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    position: 'absolute',
    top: -6,
    right: -9,
    minWidth: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
  },
  numeroTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  etiqueta: {
    fontSize: 12,
    marginTop: 2,
  },
});
