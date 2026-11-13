import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '../theme.js';

// Las imágenes del evento (multimedia): se deslizan de costado y los puntos marcan cuál se ve.
// Miden lo que mide su contenedor (no la pantalla), en 16:9 y con un alto máximo, así en
// una tablet o en una columna no ocupan toda la pantalla. Sin imágenes, el bloque gris vacío.
export function Galeria({ imagenes, altoMaximo = 320 }) {
  const [ancho, setAncho] = useState(0);
  const [actual, setActual] = useState(0);
  const alto = Math.min(Math.round((ancho * 9) / 16), altoMaximo);

  return (
    <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho === 0 || imagenes.length === 0 ? (
        <View style={[styles.imagen, { height: alto || 200 }]} />
      ) : (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / ancho))}
        >
          {imagenes.map((uri) => (
            <Image key={uri} source={{ uri }} style={[styles.imagen, { width: ancho, height: alto }]} />
          ))}
        </ScrollView>
      )}
      {imagenes.length > 1 ? (
        <View style={styles.puntos} accessibilityLabel={`Imagen ${actual + 1} de ${imagenes.length}`}>
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
    backgroundColor: colors.borderSoft,
  },
  puntos: {
    position: 'absolute',
    bottom: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  puntoActual: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
});
