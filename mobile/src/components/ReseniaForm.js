import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from './Boton.js';
import { colors, fontSize, spacing } from '../theme.js';

const COLOR_ESTRELLA = '#BA7517';

// Caso de uso 9: puntuar el evento de 1 a 5 tocando las estrellas y dejar un comentario.
// onPublicar recibe { puntuacion, detalle } y se encarga de enviarla.
export function ReseniaForm({ onPublicar }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState('');
  const [aviso, setAviso] = useState(null);

  function publicar() {
    if (puntuacion === 0) {
      setAviso('Elegí de 1 a 5 estrellas.');
      return;
    }
    if (!detalle.trim()) {
      setAviso('Contá cómo estuvo el evento.');
      return;
    }
    setAviso(null);
    onPublicar({ puntuacion, detalle: detalle.trim() });
  }

  return (
    <View style={styles.form}>
      <View style={styles.estrellas}>
        {[1, 2, 3, 4, 5].map((valor) => (
          <Pressable
            key={valor}
            onPress={() => {
              setPuntuacion(valor);
              setAviso(null);
            }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: valor <= puntuacion }}
            accessibilityLabel={`${valor} estrellas`}
          >
            <Ionicons name={valor <= puntuacion ? 'star' : 'star-outline'} size={36} color={COLOR_ESTRELLA} />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={detalle}
        onChangeText={(nuevo) => {
          setDetalle(nuevo);
          setAviso(null);
        }}
        placeholder="Contá cómo estuvo el evento"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
      />
      {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
      <Boton titulo="Publicar reseña" onPress={publicar} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  estrellas: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    minHeight: 72,
    color: colors.text,
    fontSize: fontSize.body,
    textAlignVertical: 'top',
  },
  aviso: {
    color: colors.danger,
    fontSize: fontSize.small,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
