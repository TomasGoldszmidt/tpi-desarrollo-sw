import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme.js';

// "Ticket It", con el "It" en verde.
export function Marca({ fontSize = 16 }) {
  return (
    <Text style={[styles.marca, { fontSize }]}>
      Ticket <Text style={styles.it}>It</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  marca: {
    color: colors.text,
    fontWeight: 'bold',
  },
  it: {
    color: '#4C9A2A',
  },
});
