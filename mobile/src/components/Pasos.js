import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme.js';

// Los pasos de una compra: 1 Entradas · 2 Reservar · 3 Pagar. actual empieza en 1; los
// anteriores se ven tildados. Así queda claro que reservar no es pagar.
const PASOS = ['Entradas', 'Reservar', 'Pagar'];

export function Pasos({ actual }) {
  return (
    <View style={styles.fila} accessibilityLabel={`Paso ${actual} de ${PASOS.length}: ${PASOS[actual - 1]}`}>
      {PASOS.map((paso, i) => {
        const numero = i + 1;
        const hecho = numero < actual;
        const activo = numero === actual;
        return (
          <View key={paso} style={[styles.paso, i < PASOS.length - 1 && styles.conLinea]}>
            <View style={styles.pasoInterior}>
              <View style={[styles.circulo, hecho && styles.circuloHecho, activo && styles.circuloActivo]}>
                {hecho ? (
                  <Ionicons name="checkmark" size={13} color={colors.primaryText} />
                ) : (
                  <Text style={[styles.numero, activo && styles.numeroActivo]}>{numero}</Text>
                )}
              </View>
              <Text style={[styles.texto, (activo || hecho) && styles.textoActivo, activo && styles.negrita]}>{paso}</Text>
            </View>
            {i < PASOS.length - 1 ? <View style={[styles.linea, hecho && styles.lineaHecha]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.background,
  },
  paso: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conLinea: {
    flex: 1,
  },
  pasoInterior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circulo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloHecho: {
    borderWidth: 0,
    backgroundColor: colors.primarySoft,
  },
  circuloActivo: {
    borderWidth: 0,
    backgroundColor: colors.primary,
  },
  numero: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  numeroActivo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  texto: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  textoActivo: {
    color: colors.primaryText,
  },
  negrita: {
    fontWeight: 'bold',
  },
  linea: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.borderSoft,
  },
  lineaHecha: {
    backgroundColor: colors.brand,
  },
});
