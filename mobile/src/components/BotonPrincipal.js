import { StyleSheet } from 'react-native';
import { Boton } from './Boton.js';
import { spacing } from '../theme.js';

export function BotonPrincipal({ titulo, onPress, disabled }) {
  return <Boton titulo={titulo} onPress={onPress} disabled={disabled} style={styles.boton} />;
}

const styles = StyleSheet.create({
  boton: {
    marginTop: spacing.xl,
  },
});
