import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const COLOR = '#BA7517';

// Cinco estrellas para un puntaje de 1 a 5; con medio punto o más se dibuja media estrella.
export function Estrellas({ valor, size = 14 }) {
  const llenas = Math.floor(valor);
  const media = valor - llenas >= 0.5;
  return (
    <View style={styles.fila} accessibilityLabel={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((posicion) => {
        let nombre = 'star-outline';
        if (posicion <= llenas) nombre = 'star';
        else if (posicion === llenas + 1 && media) nombre = 'star-half';
        return <Ionicons key={posicion} name={nombre} size={size} color={COLOR} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
  },
});
