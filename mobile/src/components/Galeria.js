import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, spacing } from '../theme.js';

// Las imágenes del evento (multimedia) a todo el ancho: se deslizan de costado y los
// puntos marcan cuál se ve. Sin imágenes, queda el bloque gris vacío.
export function Galeria({ imagenes }) {
  const { width } = useWindowDimensions();
  const [actual, setActual] = useState(0);

  if (imagenes.length === 0) {
    return <View style={[styles.imagen, { width }]} />;
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {imagenes.map((uri) => (
          <Image key={uri} source={{ uri }} style={[styles.imagen, { width }]} />
        ))}
      </ScrollView>
      {imagenes.length > 1 ? (
        <View style={styles.puntos}>
          {imagenes.map((uri, i) => (
            <View key={uri} style={[styles.punto, i === actual && styles.puntoActual]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  imagen: {
    height: 200,
    backgroundColor: colors.border,
  },
  puntos: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  puntoActual: {
    backgroundColor: '#FFFFFF',
  },
});
