import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Etiqueta con la misma forma que el estado, para otras marcas ("Realizado", "Agotado").
export function Etiqueta({ texto, fondo, color, icono }) {
  return (
    <View style={[styles.badge, { backgroundColor: fondo }]}>
      {icono ? <Ionicons name={icono} size={13} color={color} /> : null}
      <Text style={[styles.texto, { color }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 3,
    paddingLeft: 8,
    paddingRight: 10,
  },
  texto: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
