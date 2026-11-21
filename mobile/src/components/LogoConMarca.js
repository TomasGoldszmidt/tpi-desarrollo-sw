import { StyleSheet, View } from 'react-native';
import { Logo } from './Logo.js';
import { Marca } from './Marca.js';
import { spacing } from '../theme.js';

// El logo con el nombre de la app al lado, para el título de los headers.
export function LogoConMarca() {
  return (
    <View style={styles.marca}>
      <Logo />
      <Marca />
    </View>
  );
}

const styles = StyleSheet.create({
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
