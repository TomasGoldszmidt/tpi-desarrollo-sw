import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../../theme.js';
import { estilosFormulario } from './estilos.js';

export function CampoEvento({ etiqueta, error, onLayout, children }) {
  return (
    <View style={styles.campo} onLayout={onLayout}>
      <Text style={estilosFormulario.etiqueta}>{etiqueta}</Text>
      {children}
      {error ? <Text style={estilosFormulario.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    marginTop: spacing.md,
  },
});
