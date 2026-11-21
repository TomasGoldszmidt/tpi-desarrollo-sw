import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Boton } from './Boton.js';
import { OpcionesOrden, ORDENES } from './OpcionesOrden.js';
import { OpcionesPrecio, PRECIOS } from './OpcionesPrecio.js';
import { colors, fontSize, spacing, TOQUE_MINIMO } from '../theme.js';

// Hoja de abajo para ordenar el catálogo y filtrar por precio (la categoría está en los
// chips de la pantalla). Trabaja sobre una copia y solo la aplica con "Ver resultados";
// cerrarla la descarta. Se monta cada vez que se abre, así arranca de lo vigente.
export function FiltrosModal({ filtros, onAplicar, onCerrar }) {
  const insets = useSafeAreaInsets();
  const [orden, setOrden] = useState(filtros.orden);
  const [precio, setPrecio] = useState(filtros.precio);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar" />
      <View style={[styles.hoja, { paddingBottom: spacing.lg + insets.bottom }]} accessibilityViewIsModal>
        <View style={styles.agarre} />
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Ordenar y filtrar</Text>
          <Pressable style={styles.cerrar} onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <OpcionesOrden orden={orden} onElegir={setOrden} />

        <Text style={styles.etiqueta}>Precio de la entrada</Text>
        <OpcionesPrecio precio={precio} onElegir={setPrecio} />

        <View style={styles.botones}>
          <Boton
            titulo="Limpiar"
            variante="texto"
            onPress={() => {
              setOrden(ORDENES[0].valor);
              setPrecio(PRECIOS[0].valor);
            }}
          />
          <Boton titulo="Ver resultados" onPress={() => onAplicar({ orden, precio })} style={styles.aplicar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 28, 0.45)',
  },
  hoja: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  agarre: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  cerrar: {
    width: TOQUE_MINIMO,
    height: TOQUE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  etiqueta: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  aplicar: {
    flex: 1,
  },
});
