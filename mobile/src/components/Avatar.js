import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme.js';

// Círculo con las iniciales del usuario (ej: "LP" para Leandro Paredes).
export function Avatar({ usuario, size = 32 }) {
  const iniciales = `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();
  return (
    <View style={[styles.circulo, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.texto, { fontSize: size * 0.38 }]}>{iniciales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  texto: {
    color: colors.primaryText,
    fontWeight: 'bold',
  },
});
